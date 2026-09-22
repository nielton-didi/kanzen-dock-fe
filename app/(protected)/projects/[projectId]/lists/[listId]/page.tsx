"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { CircleAlert, ListTodo, Plus } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import {
  IssuePriorityBadge,
  IssueSeverityBadge,
  IssueStatusBadge,
  ISSUE_PRIORITIES,
  ISSUE_SEVERITIES,
  ISSUE_STATUSES,
} from "@/components/issues/issue-badges"
import { CreateIssueDialog } from "@/components/issues/create-issue-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import {
  Item,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { useWorkspaceData } from "@/contexts/workspace-context"
import { api } from "@/lib/api"
import type { Issue, IssuePriority, IssueSeverity, IssueStatus } from "@/lib/types"

type FilterValue<T extends string> = T | "all"

export default function ListPage() {
  const { projectId, listId } = useParams<{ projectId: string; listId: string }>()
  const { workspaces, listsByProject, loading, listsLoading } = useWorkspaceData()

  const project = workspaces.flatMap((w) => w.projects).find((p) => p.id === projectId)
  const list = listsByProject[projectId]?.find((l) => l.id === listId)
  const workspace = project
    ? workspaces.find((w) => w.id === project.workspace_id)
    : undefined

  const [issues, setIssues] = useState<Issue[]>([])
  const [issuesLoading, setIssuesLoading] = useState(false)
  const [issuesError, setIssuesError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<FilterValue<IssueStatus>>("all")
  const [severityFilter, setSeverityFilter] = useState<FilterValue<IssueSeverity>>("all")
  const [priorityFilter, setPriorityFilter] = useState<FilterValue<IssuePriority>>("all")
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all")

  useEffect(() => {
    if (!list) return

    let cancelled = false
    const params = new URLSearchParams()
    if (statusFilter !== "all") params.set("status", statusFilter)
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
  }, [list, statusFilter, severityFilter, priorityFilter, assigneeFilter])

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
    statusFilter !== "all" ||
    severityFilter !== "all" ||
    priorityFilter !== "all" ||
    assigneeFilter !== "all"

  return (
    <div className="flex w-full flex-1 flex-col gap-4">
      <PageHeader
        title={list.name}
        badge={
          <Badge variant="secondary" className="capitalize">
            {list.type}
          </Badge>
        }
        description={`in ${project.name}`}
        actions={
          <CreateIssueDialog
            listId={list.id}
            onCreated={(issue) => setIssues((prev) => [issue, ...prev])}
          >
            <Button>
              <Plus />
              New issue
            </Button>
          </CreateIssueDialog>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as FilterValue<IssueStatus>)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {ISSUE_STATUSES.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={severityFilter}
          onValueChange={(v) => setSeverityFilter(v as FilterValue<IssueSeverity>)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Severity" />
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
            <SelectValue placeholder="Priority" />
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
              <SelectValue placeholder="Assignee" />
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
          ) : issues.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Empty className="border-0">
                <EmptyMedia variant="icon">
                  <ListTodo />
                </EmptyMedia>
                <EmptyTitle>
                  {hasActiveFilters ? "No matching issues" : "No issues yet"}
                </EmptyTitle>
                <EmptyDescription>
                  {hasActiveFilters
                    ? "Try adjusting or clearing the filters above."
                    : `Create the first issue for "${list.name}".`}
                </EmptyDescription>
              </Empty>
            </div>
          ) : (
            <ItemGroup>
              {issues.map((issue) => (
                <Item
                  key={issue.id}
                  render={
                    <Link href={`/projects/${projectId}/lists/${listId}/issues/${issue.id}`} />
                  }
                  variant="outline"
                >
                  <ItemContent>
                    <ItemTitle>{issue.title}</ItemTitle>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <IssueStatusBadge status={issue.status} />
                      <IssueSeverityBadge severity={issue.severity} />
                      <IssuePriorityBadge priority={issue.priority} />
                    </div>
                  </ItemContent>
                  {issue.assignee && (
                    <ItemMedia>
                      <Avatar size="sm">
                        <AvatarImage src={issue.assignee.avatar_url} />
                        <AvatarFallback>
                          {(issue.assignee.name ?? issue.assignee.email)
                            .charAt(0)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </ItemMedia>
                  )}
                </Item>
              ))}
            </ItemGroup>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
