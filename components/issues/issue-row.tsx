"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { CircleAlert, Trash2, UserRound } from "lucide-react"
import { cn } from "cn"

import {
  IssuePriorityBadge,
  IssueSeverityBadge,
  IssueStatusBadge,
  IssueTypeBadge,
} from "@/components/issues/issue-badges"
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
import type { Issue } from "@/lib/types"

/** Shared column widths so the header row and every issue row line up.
 * Name gets half the row (weighted equal to the sum of the five data
 * columns); the trailing delete column is a fixed icon-only width. */
export const ISSUE_ROW_COLUMNS =
  "grid grid-cols-[minmax(0,5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_2.75rem] items-center gap-3"

export function IssueRow({
  issue,
  href,
  onDeleted,
}: {
  issue: Issue
  href: string
  onDeleted: (issueId: string) => void
}) {
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

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

  return (
    // A native <a> can't validly contain the delete button below, so the
    // row itself is click-to-navigate via router.push rather than a Link.
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(href)}
      onKeyDown={(event) => {
        if (event.key === "Enter") router.push(href)
      }}
      className={cn(
        ISSUE_ROW_COLUMNS,
        "cursor-pointer rounded-md px-2 py-2 text-sm outline-none hover:bg-muted/50 focus-visible:bg-muted/50"
      )}
    >
      <span className="truncate font-medium">{issue.title}</span>
      <IssueTypeBadge type={issue.type} className="w-fit" />
      <IssueStatusBadge status={issue.status} className="w-fit" />
      {issue.severity ? (
        <IssueSeverityBadge severity={issue.severity} className="w-fit" />
      ) : (
        <span className="text-muted-foreground">—</span>
      )}
      <IssuePriorityBadge priority={issue.priority} className="w-fit" />
      {issue.assignee ? (
        <Avatar size="sm">
          <AvatarImage src={issue.assignee.avatar_url} />
          <AvatarFallback>
            {(issue.assignee.name ?? issue.assignee.email).charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ) : (
        <UserRound className="size-4 text-muted-foreground/40" />
      )}

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
