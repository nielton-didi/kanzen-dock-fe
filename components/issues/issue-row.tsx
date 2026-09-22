"use client"

import { useState } from "react"
import { CircleAlert, Trash2, UserRound } from "lucide-react"
import { cn } from "cn"

import {
  ISSUE_PRIORITIES,
  ISSUE_SEVERITIES,
  ISSUE_TYPES,
  IssuePriorityBadge,
  IssueSeverityBadge,
  IssueStatusBadge,
  IssueTypeBadge,
  STATUS_SWATCH_CLASSNAMES,
} from "@/components/issues/issue-badges"
import { IssueFieldMenu } from "@/components/issues/issue-field-menu"
import { IssueStatusMenu } from "@/components/issues/issue-status-menu"
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
import type { Issue, Status, WorkspaceMember } from "@/lib/types"

/** Shared column widths so the header row and every issue row line up.
 * Name gets half the row (weighted equal to the sum of the five data
 * columns); the leading status-icon and trailing delete columns are
 * fixed icon-only widths. */
export const ISSUE_ROW_COLUMNS =
  "grid grid-cols-[1.5rem_minmax(0,5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_2.75rem] items-center gap-3"

type EditableField = "type" | "severity" | "priority" | "assigned_to"

export function IssueRow({
  issue,
  onOpen,
  statuses,
  workspaceMembers,
  onDeleted,
  onUpdated,
}: {
  issue: Issue
  onOpen: (issueId: string) => void
  statuses: Status[]
  workspaceMembers: WorkspaceMember[]
  onDeleted: (issueId: string) => void
  onUpdated: (issue: Issue) => void
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
      await api.delete(`/issues/${issue.id}`)
      onDeleted(issue.id)
      setDeleteOpen(false)
    } catch (err) {
      setDeleteError((err as Error).message)
    } finally {
      setDeleting(false)
    }
  }

  async function handleStatusChange(statusId: string) {
    if (statusId === issue.status_id) return
    setStatusUpdating(true)
    setStatusError(null)
    try {
      const updated = await api.put<Issue>(`/issues/${issue.id}`, {
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
      const updated = await api.put<Issue>(`/issues/${issue.id}`, { [field]: value })
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
      onClick={() => onOpen(issue.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter") onOpen(issue.id)
      }}
      className={cn(
        ISSUE_ROW_COLUMNS,
        "cursor-pointer rounded-md px-2 py-2 text-sm outline-none hover:bg-muted/50 focus-visible:bg-muted/50"
      )}
    >
      <IssueStatusMenu
        status={issue.status}
        statuses={statuses}
        disabled={statusUpdating}
        error={statusError}
        onValueChange={handleStatusChange}
        triggerClassName="size-5 shrink-0 justify-center rounded-full hover:bg-muted"
      >
        <span
          className={cn(
            "size-2.5 shrink-0 rounded-full ring-1 ring-inset ring-black/10",
            statusError ? "bg-destructive" : STATUS_SWATCH_CLASSNAMES[issue.status.color]
          )}
        />
        <span className="sr-only">Change status (currently {issue.status.name})</span>
      </IssueStatusMenu>
      <span className="truncate font-medium">{issue.title}</span>

      <IssueFieldMenu
        value={issue.type}
        options={ISSUE_TYPES}
        disabled={updatingField === "type"}
        onValueChange={(v) => {
          if (v !== issue.type) updateField("type", v)
        }}
      >
        <IssueTypeBadge
          type={issue.type}
          className={cn("w-fit", fieldErrors.type && "ring-1 ring-destructive")}
        />
      </IssueFieldMenu>

      <IssueStatusMenu
        status={issue.status}
        statuses={statuses}
        disabled={statusUpdating}
        error={statusError}
        onValueChange={handleStatusChange}
      >
        <IssueStatusBadge
          status={issue.status}
          className={cn("w-fit", statusError && "ring-1 ring-destructive")}
        />
      </IssueStatusMenu>

      {issue.type === "bug" ? (
        <IssueFieldMenu
          value={issue.severity ?? "medium"}
          options={ISSUE_SEVERITIES}
          disabled={updatingField === "severity"}
          onValueChange={(v) => {
            if (v !== issue.severity) updateField("severity", v)
          }}
        >
          {issue.severity ? (
            <IssueSeverityBadge
              severity={issue.severity}
              className={cn("w-fit", fieldErrors.severity && "ring-1 ring-destructive")}
            />
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </IssueFieldMenu>
      ) : (
        <span className="justify-self-center text-muted-foreground">—</span>
      )}

      <IssueFieldMenu
        value={issue.priority}
        options={ISSUE_PRIORITIES}
        disabled={updatingField === "priority"}
        onValueChange={(v) => {
          if (v !== issue.priority) updateField("priority", v)
        }}
      >
        <IssuePriorityBadge
          priority={issue.priority}
          className={cn("w-fit", fieldErrors.priority && "ring-1 ring-destructive")}
        />
      </IssueFieldMenu>

      <IssueFieldMenu
        value={issue.assigned_to ?? "unassigned"}
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
          if (next !== (issue.assigned_to ?? null)) updateField("assigned_to", next)
        }}
      >
        {issue.assignee ? (
          <Avatar
            size="sm"
            className={cn(fieldErrors.assigned_to && "ring-1 ring-destructive")}
          >
            <AvatarImage src={issue.assignee.avatar_url} />
            <AvatarFallback>
              {(issue.assignee.name ?? issue.assignee.email).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : (
          <UserRound className="size-4 text-muted-foreground/40" />
        )}
      </IssueFieldMenu>

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
          <span className="sr-only">Delete &quot;{issue.title}&quot;</span>
        </AlertDialogTrigger>
        <AlertDialogContent onClick={(event) => event.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete issue?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{issue.title}&quot; and its attachments and history will
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
              variant="destructive"
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
