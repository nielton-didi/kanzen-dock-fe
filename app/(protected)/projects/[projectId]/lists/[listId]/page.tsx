"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useParams, useRouter, useSearchParams } from "next/navigation"
import {
  CircleAlert,
  CircleDot,
  Flag,
  ListTodo,
  Plus,
  Settings,
  UserRound,
  X,
} from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { ProjectListSwitcher } from "@/components/layout/project-list-switcher"
import { StatusGroup } from "@/components/work-items/status-group"
import { WORK_ITEM_PRIORITIES } from "@/components/work-items/work-item-badges"
import {
  CustomFieldFilters,
  type CustomFieldFilterState,
} from "@/components/custom-fields/custom-field-filters"
import { CreateWorkItemDialog } from "@/components/work-items/create-work-item-dialog"
import { WorkItemDetailDialog } from "@/components/work-items/work-item-detail-dialog"
import { FilterDropdown } from "@/components/work-items/filter-dropdown"
import { CreateStatusDialog } from "@/components/statuses/create-status-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import { useWorkspaceData } from "@/contexts/workspace-context"
import { useListCustomFields } from "@/hooks/use-list-custom-fields"
import { useListStatuses } from "@/hooks/use-list-statuses"
import { api } from "@/lib/api"
import { customFieldFilterParams } from "@/lib/custom-fields"
import type { WorkItem, WorkItemPriority } from "@/lib/types"

export default function ListPage() {
  const { projectId, listId } = useParams<{ projectId: string; listId: string }>()
  const { workspaces, listsByProject, loading, listsLoading } = useWorkspaceData()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const selectedWorkItemId = searchParams.get("item")

  const project = workspaces.flatMap((w) => w.projects).find((p) => p.id === projectId)
  const list = listsByProject[projectId]?.find((l) => l.id === listId)
  const workspace = project
    ? workspaces.find((w) => w.id === project.workspace_id)
    : undefined

  const { statuses, setStatuses } = useListStatuses(list?.id)
  const { fields } = useListCustomFields(list?.id)
  const workspaceMembers = useMemo(() => workspace?.members ?? [], [workspace])

  const [workItems, setWorkItems] = useState<WorkItem[]>([])
  const [workItemsLoading, setWorkItemsLoading] = useState(false)
  const [workItemsError, setWorkItemsError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [priorityFilter, setPriorityFilter] = useState<WorkItemPriority[]>([])
  const [assigneeFilter, setAssigneeFilter] = useState<string[]>([])
  const [customFieldFilter, setCustomFieldFilter] = useState<CustomFieldFilterState>({})
  const [collapsedStatusIds, setCollapsedStatusIds] = useState<Set<string>>(
    () => new Set()
  )

  const workItemsByStatus = useMemo(() => {
    const map = new Map<string, WorkItem[]>()
    for (const workItem of workItems) {
      const bucket = map.get(workItem.status_id)
      if (bucket) bucket.push(workItem)
      else map.set(workItem.status_id, [workItem])
    }
    return map
  }, [workItems])

  // Flat, visually-ordered list of the work items currently on screen (grouped
  // by status, in the same order StatusGroup renders them), used to drive
  // the detail dialog's prev/next chevrons.
  const orderedWorkItems = useMemo(
    () => statuses.flatMap((status) => workItemsByStatus.get(status.id) ?? []),
    [statuses, workItemsByStatus]
  )

  function openWorkItem(workItemId: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("item", workItemId)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  function closeWorkItemDialog() {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("item")
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
    setStatusFilter([])
    setPriorityFilter([])
    setAssigneeFilter([])
    setCustomFieldFilter({})
  }

  useEffect(() => {
    if (!list) return

    let cancelled = false
    const params = new URLSearchParams()
    statusFilter.forEach((v) => params.append("status_id", v))
    priorityFilter.forEach((v) => params.append("priority", v))
    assigneeFilter.forEach((v) => params.append("assigned_to", v))
    customFieldFilterParams(customFieldFilter).forEach((v) => params.append("cf", v))
    const qs = params.toString()

    // setWorkItemsLoading/setWorkItemsError are deferred into the .then() below
    // (rather than called synchronously here) to avoid a cascading render
    // from setState-in-effect - same pattern as WorkspaceProvider's
    // lists-fetch effect.
    Promise.resolve()
      .then(() => {
        if (cancelled) return undefined
        setWorkItemsLoading(true)
        setWorkItemsError(null)
        return api.get<WorkItem[]>(`/lists/${list.id}/work-items${qs ? `?${qs}` : ""}`)
      })
      .then((data) => {
        if (!cancelled && data) setWorkItems(data)
      })
      .catch((err) => {
        if (!cancelled) setWorkItemsError((err as Error).message)
      })
      .finally(() => {
        if (!cancelled) setWorkItemsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [
    list,
    statusFilter,
    priorityFilter,
    assigneeFilter,
    customFieldFilter,
  ])

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
        <div className="flex flex-1 items-center justify-center py-10">
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
    statusFilter.length > 0 ||
    priorityFilter.length > 0 ||
    assigneeFilter.length > 0 ||
    Object.keys(customFieldFilter).length > 0

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
            <Button variant="ghost" size="icon"
              nativeButton={false}
              render={
                <Link href={`/projects/${projectId}/lists/${listId}/settings`} />
              }
            >
              <Settings />
              <span className="sr-only">List settings</span>
            </Button>
            <CreateWorkItemDialog
              listId={list.id}
              fields={fields}
              workspaceMembers={workspaceMembers}
              onCreated={(workItem) => setWorkItems((prev) => [workItem, ...prev])}
            >
              <Button variant="primary">
                <Plus />
                New work item
              </Button>
            </CreateWorkItemDialog>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <FilterDropdown
          icon={<CircleDot className="size-3.5 shrink-0 text-muted-foreground" />}
          label="Status"
          value={statusFilter}
          options={statuses.map((status) => ({ value: status.id, label: status.name }))}
          onValueChange={setStatusFilter}
        />

        <FilterDropdown
          icon={<Flag className="size-3.5 shrink-0 text-muted-foreground" />}
          label="Priority"
          value={priorityFilter}
          options={WORK_ITEM_PRIORITIES}
          onValueChange={(v) => setPriorityFilter(v as WorkItemPriority[])}
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

        <CustomFieldFilters
          fields={fields}
          members={workspaceMembers}
          value={customFieldFilter}
          onValueChange={setCustomFieldFilter}
        />

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X />
            Clear filters
          </Button>
        )}
      </div>

      {workItemsError && (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertDescription>{workItemsError}</AlertDescription>
        </Alert>
      )}

      <div className="flex-1">
        {workItemsLoading ? (
          <div className="flex items-center justify-center py-10">
            <Spinner className="size-6 text-muted-foreground" />
          </div>
        ) : hasActiveFilters && workItems.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <Empty className="border-0">
              <EmptyMedia variant="icon">
                <ListTodo />
              </EmptyMedia>
              <EmptyTitle>No matching work items</EmptyTitle>
              <EmptyDescription>
                Try adjusting or clearing the filters above.
              </EmptyDescription>
            </Empty>
          </div>
        ) : statuses.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <Empty className="border-0">
              <EmptyMedia variant="icon">
                <ListTodo />
              </EmptyMedia>
              <EmptyTitle>No work items yet</EmptyTitle>
              <EmptyDescription>
                {`Create the first work item for "${list.name}".`}
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
                fields={fields}
                workItems={workItemsByStatus.get(status.id) ?? []}
                workspaceMembers={workspace?.members ?? []}
                listId={listId}
                onWorkItemOpen={openWorkItem}
                open={!collapsedStatusIds.has(status.id)}
                onOpenChange={(open) => toggleStatusCollapsed(status.id, open)}
                onWorkItemCreated={(workItem) => setWorkItems((prev) => [workItem, ...prev])}
                onWorkItemDeleted={(workItemId) =>
                  setWorkItems((prev) => prev.filter((i) => i.id !== workItemId))
                }
                onWorkItemUpdated={(updated) =>
                  setWorkItems((prev) =>
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

      <WorkItemDetailDialog
        workItemId={selectedWorkItemId}
        workItems={orderedWorkItems}
        statuses={statuses}
        fields={fields}
        workspaceMembers={workspaceMembers}
        onOpenChange={(open) => {
          if (!open) closeWorkItemDialog()
        }}
        onNavigate={openWorkItem}
        onUpdated={(updated) =>
          setWorkItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
        }
        onDeleted={(workItemId) =>
          setWorkItems((prev) => prev.filter((i) => i.id !== workItemId))
        }
      />
    </div>
  )
}
