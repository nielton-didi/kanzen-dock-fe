"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useParams, useRouter, useSearchParams } from "next/navigation"
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
  X,
} from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { ProjectListSwitcher } from "@/components/layout/project-list-switcher"
import { StatusGroup } from "@/components/issues/status-group"
import {
  ISSUE_PRIORITIES,
  ISSUE_SEVERITIES,
  ISSUE_TYPES,
} from "@/components/issues/issue-badges"
import { CreateIssueDialog } from "@/components/issues/create-issue-dialog"
import { IssueDetailDialog } from "@/components/issues/issue-detail-dialog"
import { FilterDropdown } from "@/components/issues/filter-dropdown"
import { CreateStatusDialog } from "@/components/statuses/create-status-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import { useWorkspaceData } from "@/contexts/workspace-context"
import { useListStatuses } from "@/hooks/use-list-statuses"
import { api } from "@/lib/api"
import type { Issue, IssuePriority, IssueSeverity, IssueType } from "@/lib/types"

export default function ListPage() {
  const { projectId, listId } = useParams<{ projectId: string; listId: string }>()
  const { workspaces, listsByProject, loading, listsLoading } = useWorkspaceData()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const selectedIssueId = searchParams.get("issue")

  const project = workspaces.flatMap((w) => w.projects).find((p) => p.id === projectId)
  const list = listsByProject[projectId]?.find((l) => l.id === listId)
  const workspace = project
    ? workspaces.find((w) => w.id === project.workspace_id)
    : undefined

  const { statuses, setStatuses } = useListStatuses(list?.id)

  const [issues, setIssues] = useState<Issue[]>([])
  const [issuesLoading, setIssuesLoading] = useState(false)
  const [issuesError, setIssuesError] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<IssueType[]>([])
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [severityFilter, setSeverityFilter] = useState<IssueSeverity[]>([])
  const [priorityFilter, setPriorityFilter] = useState<IssuePriority[]>([])
  const [assigneeFilter, setAssigneeFilter] = useState<string[]>([])
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

  // Flat, visually-ordered list of the issues currently on screen (grouped
  // by status, in the same order StatusGroup renders them), used to drive
  // the detail dialog's prev/next chevrons.
  const orderedIssues = useMemo(
    () => statuses.flatMap((status) => issuesByStatus.get(status.id) ?? []),
    [statuses, issuesByStatus]
  )

  function openIssue(issueId: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("issue", issueId)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  function closeIssueDialog() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("issue")
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  function toggleStatusCollapsed(statusId: string, open: boolean) {
    setCollapsedStatusIds((prev) => {
      const next = new Set(prev)
      if (open) next.delete(statusId)
      else next.add(statusId)
      return next
    })
  }

  function clearFilters() {
    setTypeFilter([])
    setStatusFilter([])
    setSeverityFilter([])
    setPriorityFilter([])
    setAssigneeFilter([])
  }

  useEffect(() => {
    if (!list) return

    let cancelled = false
    const params = new URLSearchParams()
    typeFilter.forEach((v) => params.append("type", v))
    statusFilter.forEach((v) => params.append("status_id", v))
    severityFilter.forEach((v) => params.append("severity", v))
    priorityFilter.forEach((v) => params.append("priority", v))
    assigneeFilter.forEach((v) => params.append("assigned_to", v))
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
        <div className="flex flex-1 items-center justify-center py-16">
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
        </div>
      </div>
    )
  }

  const hasActiveFilters =
    typeFilter.length > 0 ||
    statusFilter.length > 0 ||
    severityFilter.length > 0 ||
    priorityFilter.length > 0 ||
    assigneeFilter.length > 0

  return (
    <div className="flex w-full flex-1 flex-col gap-4">
      <PageHeader
        title={
          <ProjectListSwitcher
            projects={workspace?.projects ?? [project]}
            activeProjectId={projectId}
            lists={listsByProject[projectId] ?? []}
            activeListId={listId}
            listsByProject={listsByProject}
          />
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
        <FilterDropdown
          icon={<Tags className="size-3.5 shrink-0 text-muted-foreground" />}
          label="Type"
          value={typeFilter}
          options={ISSUE_TYPES}
          onValueChange={(v) => setTypeFilter(v as IssueType[])}
        />

        <FilterDropdown
          icon={<CircleDot className="size-3.5 shrink-0 text-muted-foreground" />}
          label="Status"
          value={statusFilter}
          options={statuses.map((status) => ({ value: status.id, label: status.name }))}
          onValueChange={setStatusFilter}
        />

        <FilterDropdown
          icon={<AlertTriangle className="size-3.5 shrink-0 text-muted-foreground" />}
          label="Severity"
          value={severityFilter}
          options={ISSUE_SEVERITIES}
          onValueChange={(v) => setSeverityFilter(v as IssueSeverity[])}
        />

        <FilterDropdown
          icon={<Flag className="size-3.5 shrink-0 text-muted-foreground" />}
          label="Priority"
          value={priorityFilter}
          options={ISSUE_PRIORITIES}
          onValueChange={(v) => setPriorityFilter(v as IssuePriority[])}
        />

        {workspace && workspace.members.length > 0 && (
          <FilterDropdown
            icon={<UserRound className="size-3.5 shrink-0 text-muted-foreground" />}
            label="Assignee"
            value={assigneeFilter}
            options={workspace.members.map((member) => ({
              value: member.user_id,
              label: member.user.name ?? member.user.email,
            }))}
            onValueChange={setAssigneeFilter}
          />
        )}

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X />
            Clear filters
          </Button>
        )}
      </div>

      {issuesError && (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertDescription>{issuesError}</AlertDescription>
        </Alert>
      )}

      <div className="flex-1">
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
                statuses={statuses}
                issues={issuesByStatus.get(status.id) ?? []}
                workspaceMembers={workspace?.members ?? []}
                listId={listId}
                onIssueOpen={openIssue}
                open={!collapsedStatusIds.has(status.id)}
                onOpenChange={(open) => toggleStatusCollapsed(status.id, open)}
                onIssueCreated={(issue) => setIssues((prev) => [issue, ...prev])}
                onIssueDeleted={(issueId) =>
                  setIssues((prev) => prev.filter((i) => i.id !== issueId))
                }
                onIssueUpdated={(updated) =>
                  setIssues((prev) =>
                    prev.map((i) => (i.id === updated.id ? updated : i))
                  )
                }
              />
            ))}
            <CreateStatusDialog
              listId={list.id}
              onCreated={(status) => setStatuses((prev) => [...prev, status])}
            >
              <button
                type="button"
                className="flex w-fit items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              >
                <Plus className="size-3.5" />
                New status
              </button>
            </CreateStatusDialog>
          </div>
        )}
      </div>

      <IssueDetailDialog
        issueId={selectedIssueId}
        issues={orderedIssues}
        statuses={statuses}
        workspaceMembers={workspace?.members ?? []}
        onOpenChange={(open) => {
          if (!open) closeIssueDialog()
        }}
        onNavigate={openIssue}
        onUpdated={(updated) =>
          setIssues((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
        }
        onDeleted={(issueId) =>
          setIssues((prev) => prev.filter((i) => i.id !== issueId))
        }
      />
    </div>
  )
}
