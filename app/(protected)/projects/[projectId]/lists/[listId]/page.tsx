"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  AlertTriangle,
  CircleAlert,
  CircleDot,
  Flag,
  ListTodo,
  Plus,
  Settings,
  Tags,
  UserRound,
} from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { StatusGroup } from "@/components/issues/status-group"
import {
  ISSUE_PRIORITIES,
  ISSUE_SEVERITIES,
  ISSUE_TYPES,
} from "@/components/issues/issue-badges"
import { CreateIssueDialog } from "@/components/issues/create-issue-dialog"
import { CreateStatusDialog } from "@/components/statuses/create-status-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { useWorkspaceData } from "@/contexts/workspace-context"
import { useListStatuses } from "@/hooks/use-list-statuses"
import { api } from "@/lib/api"
import type { Issue, IssuePriority, IssueSeverity, IssueType } from "@/lib/types"

type FilterValue<T extends string> = T | "all"

export default function ListPage() {
  const { projectId, listId } = useParams<{ projectId: string; listId: string }>()
  const { workspaces, listsByProject, loading, listsLoading } = useWorkspaceData()

  const project = workspaces.flatMap((w) => w.projects).find((p) => p.id === projectId)
  const list = listsByProject[projectId]?.find((l) => l.id === listId)
  const workspace = project
    ? workspaces.find((w) => w.id === project.workspace_id)
    : undefined

  const { statuses, refetch: refetchStatuses } = useListStatuses(list?.id)

  const [issues, setIssues] = useState<Issue[]>([])
  const [issuesLoading, setIssuesLoading] = useState(false)
  const [issuesError, setIssuesError] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<FilterValue<IssueType>>("all")
  const [statusFilter, setStatusFilter] = useState<FilterValue<string>>("all")
  const [severityFilter, setSeverityFilter] = useState<FilterValue<IssueSeverity>>("all")
  const [priorityFilter, setPriorityFilter] = useState<FilterValue<IssuePriority>>("all")
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all")
  const [collapsedStatusIds, setCollapsedStatusIds] = useState<Set<string>>(
    () => new Set()
  )

  const issuesByStatus = useMemo(() => {
    const map = new Map<string, Issue[]>()
    for (const issue of issues) {
      const bucket = map.get(issue.status_id)
      if (bucket) bucket.push(issue)
      else map.set(issue.status_id, [issue])
    }
    return map
  }, [issues])

  function toggleStatusCollapsed(statusId: string, open: boolean) {
    setCollapsedStatusIds((prev) => {
      const next = new Set(prev)
      if (open) next.delete(statusId)
      else next.add(statusId)
      return next
    })
  }

  useEffect(() => {
    if (!list) return

    let cancelled = false
    const params = new URLSearchParams()
    if (typeFilter !== "all") params.set("type", typeFilter)
    if (statusFilter !== "all") params.set("status_id", statusFilter)
    if (severityFilter !== "all") params.set("severity", severityFilter)
    if (priorityFilter !== "all") params.set("priority", priorityFilter)
    if (assigneeFilter !== "all") params.set("assigned_to", assigneeFilter)
    const qs = params.toString()

    // setIssuesLoading/setIssuesError are deferred into the .then() below
    // (rather than called synchronously here) to avoid a cascading render
    // from setState-in-effect - same pattern as WorkspaceProvider's
    // lists-fetch effect.
    Promise.resolve()
      .then(() => {
        if (cancelled) return undefined
        setIssuesLoading(true)
        setIssuesError(null)
        return api.get<Issue[]>(`/lists/${list.id}/issues${qs ? `?${qs}` : ""}`)
      })
      .then((data) => {
        if (!cancelled && data) setIssues(data)
      })
      .catch((err) => {
        if (!cancelled) setIssuesError((err as Error).message)
      })
      .finally(() => {
        if (!cancelled) setIssuesLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [list, typeFilter, statusFilter, severityFilter, priorityFilter, assigneeFilter])

  if (loading || (listsLoading && !list)) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    )
  }

  if (!project || !list) {
    return (
      <div className="flex w-full flex-1 flex-col gap-4">
        <PageHeader title="List not found" />
        <Card className="flex-1">
          <CardContent className="flex flex-1 items-center justify-center py-16">
            <Empty className="border-0">
              <EmptyMedia variant="icon">
                <ListTodo />
              </EmptyMedia>
              <EmptyTitle>Couldn&apos;t find this list</EmptyTitle>
              <EmptyDescription>
                It may belong to a different workspace - try switching
                workspaces from the sidebar.
              </EmptyDescription>
            </Empty>
          </CardContent>
        </Card>
      </div>
    )
  }

  const hasActiveFilters =
    typeFilter !== "all" ||
    statusFilter !== "all" ||
    severityFilter !== "all" ||
    priorityFilter !== "all" ||
    assigneeFilter !== "all"

  return (
    <div className="flex w-full flex-1 flex-col gap-4">
      <PageHeader
        title={
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href={`/projects/${projectId}`} />}>
                  {project.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-xl font-semibold tracking-tight">
                  {list.name}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              nativeButton={false}
              render={
                <Link href={`/projects/${projectId}/lists/${listId}/settings`} />
              }
            >
              <Settings />
              <span className="sr-only">List settings</span>
            </Button>
            <CreateIssueDialog
              listId={list.id}
              onCreated={(issue) => setIssues((prev) => [issue, ...prev])}
            >
              <Button>
                <Plus />
                New issue
              </Button>
            </CreateIssueDialog>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as FilterValue<IssueType>)}
        >
          <SelectTrigger className="w-32">
            <span className="flex items-center gap-1.5">
              <Tags className="size-3.5 text-muted-foreground" />
              <SelectValue placeholder="Type" />
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {ISSUE_TYPES.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as FilterValue<string>)}
        >
          <SelectTrigger className="w-36">
            <span className="flex items-center gap-1.5">
              <CircleDot className="size-3.5 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {statuses.map((status) => (
              <SelectItem key={status.id} value={status.id}>
                {status.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <CreateStatusDialog listId={list.id} onCreated={() => refetchStatuses()}>
          <Button variant="outline" size="sm">
            <Plus />
            Add status
          </Button>
        </CreateStatusDialog>

        <Select
          value={severityFilter}
          onValueChange={(v) => setSeverityFilter(v as FilterValue<IssueSeverity>)}
        >
          <SelectTrigger className="w-36">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="size-3.5 text-muted-foreground" />
              <SelectValue placeholder="Severity" />
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All severities</SelectItem>
            {ISSUE_SEVERITIES.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={priorityFilter}
          onValueChange={(v) => setPriorityFilter(v as FilterValue<IssuePriority>)}
        >
          <SelectTrigger className="w-36">
            <span className="flex items-center gap-1.5">
              <Flag className="size-3.5 text-muted-foreground" />
              <SelectValue placeholder="Priority" />
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {ISSUE_PRIORITIES.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {workspace && workspace.members.length > 0 && (
          <Select
            value={assigneeFilter}
            onValueChange={(v) => setAssigneeFilter(v ?? "all")}
          >
            <SelectTrigger className="w-40">
              <span className="flex items-center gap-1.5">
                <UserRound className="size-3.5 text-muted-foreground" />
                <SelectValue placeholder="Assignee" />
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All assignees</SelectItem>
              {workspace.members.map((member) => (
                <SelectItem key={member.user_id} value={member.user_id}>
                  {member.user.name ?? member.user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {issuesError && (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertDescription>{issuesError}</AlertDescription>
        </Alert>
      )}

      <Card className="flex-1">
        <CardContent className="py-4">
          {issuesLoading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner className="size-6 text-muted-foreground" />
            </div>
          ) : hasActiveFilters && issues.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Empty className="border-0">
                <EmptyMedia variant="icon">
                  <ListTodo />
                </EmptyMedia>
                <EmptyTitle>No matching issues</EmptyTitle>
                <EmptyDescription>
                  Try adjusting or clearing the filters above.
                </EmptyDescription>
              </Empty>
            </div>
          ) : statuses.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Empty className="border-0">
                <EmptyMedia variant="icon">
                  <ListTodo />
                </EmptyMedia>
                <EmptyTitle>No issues yet</EmptyTitle>
                <EmptyDescription>
                  {`Create the first issue for "${list.name}".`}
                </EmptyDescription>
              </Empty>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {statuses.map((status) => (
                <StatusGroup
                  key={status.id}
                  status={status}
                  issues={issuesByStatus.get(status.id) ?? []}
                  listId={listId}
                  projectId={projectId}
                  open={!collapsedStatusIds.has(status.id)}
                  onOpenChange={(open) => toggleStatusCollapsed(status.id, open)}
                  onIssueCreated={(issue) => setIssues((prev) => [issue, ...prev])}
                  onIssueDeleted={(issueId) =>
                    setIssues((prev) => prev.filter((i) => i.id !== issueId))
                  }
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
