"use client"

import { useState } from "react"
import { CalendarDays, CircleAlert, Trash2, UserRound } from "lucide-react"
import { cn } from "cn"

import {
  WORK_ITEM_PRIORITY_OPTIONS,
  WORK_ITEM_SEVERITIES,
  WORK_ITEM_TYPES,
  WorkItemPriorityLabel,
  WorkItemSeverityBadge,
  WorkItemStatusBadge,
  WorkItemTypeBadge,
  STATUS_SWATCH_CLASSNAMES,
} from "@/components/work-items/work-item-badges"
import { WorkItemDatePicker } from "@/components/work-items/work-item-date-picker"
import { WorkItemFieldMenu } from "@/components/work-items/work-item-field-menu"
import { WorkItemStatusMenu } from "@/components/work-items/work-item-status-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { toDayKey } from "@/lib/dates"
import { isOpenWork, type WorkItem, type Status, type WorkspaceMember } from "@/lib/types"

/** Shared column widths so the header row and every work item row line up.
 * Name gets half the row (weighted equal to the sum of the six data
 * columns); the leading status-icon and trailing delete columns are
 * fixed icon-only widths. */
export const WORK_ITEM_ROW_COLUMNS =
  "grid grid-cols-[1.5rem_minmax(0,6fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_2.75rem] items-center gap-3"

type EditableField = "type" | "severity" | "priority" | "due_date" | "assigned_to"

export function WorkItemRow({
  workItem,
  onOpen,
  statuses,
  workspaceMembers,
  onDeleted,
  onUpdated,
}: {
  workItem: WorkItem
  onOpen: (workItemId: string) => void
  statuses: Status[]
  workspaceMembers: WorkspaceMember[]
  onDeleted: (workItemId: string) => void
  onUpdated: (workItem: WorkItem) => void
}) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [updatingField, setUpdatingField] = useState<EditableField | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<EditableField, string>>>(
    {}
  )

  async function handleDelete() {
    setDeleting(true)
    setDeleteError(null)
    try {
      await api.delete(`/work-items/${workItem.id}`)
      onDeleted(workItem.id)
      setDeleteOpen(false)
    } catch (err) {
      setDeleteError((err as Error).message)
    } finally {
      setDeleting(false)
    }
  }

  async function handleStatusChange(statusId: string) {
    if (statusId === workItem.status_id) return
    setStatusUpdating(true)
    setStatusError(null)
    try {
      const updated = await api.put<WorkItem>(`/work-items/${workItem.id}`, {
        status_id: statusId,
      })
      onUpdated(updated)
    } catch (err) {
      setStatusError((err as Error).message)
    } finally {
      setStatusUpdating(false)
    }
  }

  async function updateField(field: EditableField, value: string | null) {
    setUpdatingField(field)
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
    try {
      const updated = await api.put<WorkItem>(`/work-items/${workItem.id}`, { [field]: value })
      onUpdated(updated)
    } catch (err) {
      setFieldErrors((prev) => ({ ...prev, [field]: (err as Error).message }))
    } finally {
      setUpdatingField(null)
    }
  }

  return (
    // A native <a> can't validly contain the delete button below, so the
    // row itself is click-to-open rather than a Link.
    <div
      role="link"
      tabIndex={0}
      onClick={() => onOpen(workItem.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter") onOpen(workItem.id)
      }}
      className={cn(
        WORK_ITEM_ROW_COLUMNS,
        "cursor-pointer rounded-md px-2 py-2 text-sm outline-none hover:bg-muted/50 focus-visible:bg-muted/50"
      )}
    >
      <WorkItemStatusMenu
        status={workItem.status}
        statuses={statuses}
        disabled={statusUpdating}
        error={statusError}
        onValueChange={handleStatusChange}
        triggerClassName="size-5 shrink-0 justify-center rounded-full hover:bg-muted"
      >
        <span
          className={cn(
            "size-2.5 shrink-0 rounded-full ring-1 ring-inset ring-black/10",
            statusError ? "bg-destructive" : STATUS_SWATCH_CLASSNAMES[workItem.status.color]
          )}
        />
        <span className="sr-only">Change status (currently {workItem.status.name})</span>
      </WorkItemStatusMenu>
      <span className="truncate font-medium">{workItem.title}</span>

      <WorkItemFieldMenu
        value={workItem.type}
        options={WORK_ITEM_TYPES}
        disabled={updatingField === "type"}
        onValueChange={(v) => {
          if (v !== workItem.type) updateField("type", v)
        }}
      >
        <WorkItemTypeBadge
          type={workItem.type}
          className={cn("w-fit", fieldErrors.type && "ring-1 ring-destructive")}
        />
      </WorkItemFieldMenu>

      <WorkItemStatusMenu
        status={workItem.status}
        statuses={statuses}
        disabled={statusUpdating}
        error={statusError}
        onValueChange={handleStatusChange}
      >
        <WorkItemStatusBadge
          status={workItem.status}
          className={cn("w-fit", statusError && "ring-1 ring-destructive")}
        />
      </WorkItemStatusMenu>

      {workItem.type === "bug" ? (
        <WorkItemFieldMenu
          value={workItem.severity ?? "medium"}
          options={WORK_ITEM_SEVERITIES}
          disabled={updatingField === "severity"}
          onValueChange={(v) => {
            if (v !== workItem.severity) updateField("severity", v)
          }}
        >
          {workItem.severity ? (
            <WorkItemSeverityBadge
              severity={workItem.severity}
              className={cn("w-fit", fieldErrors.severity && "ring-1 ring-destructive")}
            />
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </WorkItemFieldMenu>
      ) : (
        <span className="justify-self-center text-muted-foreground">—</span>
      )}

      <WorkItemFieldMenu
        value={workItem.priority}
        options={WORK_ITEM_PRIORITY_OPTIONS}
        disabled={updatingField === "priority"}
        onValueChange={(v) => {
          if (v !== workItem.priority) updateField("priority", v)
        }}
      >
        <WorkItemPriorityLabel
          priority={workItem.priority}
          compact
          className={cn("px-1 py-0.5", fieldErrors.priority && "rounded-md ring-1 ring-destructive")}
        />
      </WorkItemFieldMenu>

      <WorkItemDatePicker
        label="Due date"
        value={workItem.due_date ? toDayKey(workItem.due_date) : null}
        min={workItem.start_date ? toDayKey(workItem.start_date) : null}
        highlightDue={isOpenWork(workItem)}
        loading={updatingField === "due_date"}
        error={Boolean(fieldErrors.due_date)}
        onChange={(v) => updateField("due_date", v)}
        placeholder={<CalendarDays className="size-3.5 text-subtle-foreground" />}
        className="justify-self-center"
      />

      <WorkItemFieldMenu
        value={workItem.assigned_to ?? "unassigned"}
        options={[
          { value: "unassigned", label: "Unassigned" },
          ...workspaceMembers.map((member) => ({
            value: member.user_id,
            label: member.user.name ?? member.user.email,
          })),
        ]}
        disabled={updatingField === "assigned_to"}
        onValueChange={(v) => {
          const next = v === "unassigned" ? null : v
          if (next !== (workItem.assigned_to ?? null)) updateField("assigned_to", next)
        }}
      >
        {workItem.assignee ? (
          <Avatar
            size="sm"
            className={cn(fieldErrors.assigned_to && "ring-1 ring-destructive")}
          >
            <AvatarImage src={workItem.assignee.avatar_url} />
            <AvatarFallback>
              {(workItem.assignee.name ?? workItem.assignee.email).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : (
          <UserRound className="size-4 text-subtle-foreground" />
        )}
      </WorkItemFieldMenu>

      <AlertDialog
        open={deleteOpen}
        onOpenChange={(next) => {
          setDeleteOpen(next)
          if (!next) setDeleteError(null)
        }}
      >
        <AlertDialogTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(event) => event.stopPropagation()}
            />
          }
        >
          <Trash2 className="size-3.5 text-muted-foreground" />
          <span className="sr-only">Delete &quot;{workItem.title}&quot;</span>
        </AlertDialogTrigger>
        <AlertDialogContent onClick={(event) => event.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete work item?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{workItem.title}&quot; and its attachments and history will
              be permanently deleted. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="danger"
              disabled={deleting}
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
