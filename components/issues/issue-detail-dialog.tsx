"use client"

import { useEffect, useRef, useState } from "react"
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Check,
  CircleAlert,
  CircleDot,
  Flag,
  History,
  Link as LinkIcon,
  Trash2,
  UserRound,
  XIcon,
} from "lucide-react"

import {
  ISSUE_PRIORITIES,
  ISSUE_SEVERITIES,
  ISSUE_TYPES,
  IssuePriorityBadge,
  IssueSeverityBadge,
  IssueTypeBadge,
} from "@/components/issues/issue-badges"
import { IssueActivity } from "@/components/issues/issue-activity"
import { IssueAttachments } from "@/components/issues/issue-attachments"
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
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuth } from "@/hooks/use-auth"
import { useIssue } from "@/hooks/use-issue"
import { api } from "@/lib/api"
import type { Issue, Status, WorkspaceMember } from "@/lib/types"

function initials(name?: string, email?: string) {
  return (name ?? email ?? "?").charAt(0).toUpperCase()
}

function PropertyRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="flex w-28 shrink-0 items-center gap-1.5 text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="flex min-w-0 flex-1 items-center">{children}</div>
    </div>
  )
}

export function IssueDetailDialog({
  issueId,
  issues,
  statuses,
  workspaceMembers,
  onOpenChange,
  onNavigate,
  onUpdated,
  onDeleted,
}: {
  /** The currently open issue's id, or null when the dialog is closed. */
  issueId: string | null
  /** The visually-ordered list of issues on the page, used for the
   * prev/next chevrons - must be in the same order they're rendered in. */
  issues: Issue[]
  statuses: Status[]
  workspaceMembers: WorkspaceMember[]
  onOpenChange: (open: boolean) => void
  onNavigate: (issueId: string) => void
  onUpdated: (issue: Issue) => void
  onDeleted: (issueId: string) => void
}) {
  const { issue, setIssue, loading, error } = useIssue(issueId ?? undefined)
  const { user } = useAuth()

  const [updateError, setUpdateError] = useState<string | null>(null)
  const [updatingField, setUpdatingField] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const [titleDraft, setTitleDraft] = useState("")
  const [descriptionDraft, setDescriptionDraft] = useState("")
  const [savingDescription, setSavingDescription] = useState(false)
  const copyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.resolve().then(() => {
      if (cancelled) return
      setTitleDraft(issue?.title ?? "")
      setDescriptionDraft(issue?.description ?? "")
    })
    return () => {
      cancelled = true
    }
  }, [issue?.id, issue?.title, issue?.description])

  const descriptionDirty = issue !== null && descriptionDraft !== (issue.description ?? "")

  useEffect(() => {
    return () => {
      if (copyTimeout.current) clearTimeout(copyTimeout.current)
    }
  }, [])

  const open = issueId !== null

  const currentIndex = issue ? issues.findIndex((i) => i.id === issue.id) : -1
  const previousIssue = currentIndex > 0 ? issues[currentIndex - 1] : null
  const nextIssue =
    currentIndex >= 0 && currentIndex < issues.length - 1
      ? issues[currentIndex + 1]
      : null

  const statusIndex = issue ? statuses.findIndex((s) => s.id === issue.status_id) : -1
  const nextStatus =
    statusIndex >= 0 && statusIndex < statuses.length - 1
      ? statuses[statusIndex + 1]
      : null

  async function updateIssue(field: string, value: string | null) {
    if (!issue) return
    setUpdatingField(field)
    setUpdateError(null)
    try {
      await api.put<Issue>(`/issues/${issue.id}`, { [field]: value })
      // The PUT response doesn't include the nested `list`/`history` this
      // dialog needs, and the update also logs a new history entry - so
      // refetch the full detail response instead of merging the partial one.
      const fresh = await api.get<Issue>(`/issues/${issue.id}`)
      setIssue(fresh)
      onUpdated(fresh)
    } catch (err) {
      setUpdateError((err as Error).message)
    } finally {
      setUpdatingField(null)
    }
  }

  async function handleTitleSave() {
    const next = titleDraft.trim()
    if (!issue || !next || next === issue.title) {
      setTitleDraft(issue?.title ?? "")
      return
    }
    await updateIssue("title", next)
  }

  async function handleDescriptionSave() {
    if (!issue) return
    setSavingDescription(true)
    setUpdateError(null)
    try {
      const next = descriptionDraft.trim()
      await api.put<Issue>(`/issues/${issue.id}`, { description: next || null })
      const fresh = await api.get<Issue>(`/issues/${issue.id}`)
      setIssue(fresh)
      onUpdated(fresh)
    } catch (err) {
      setUpdateError((err as Error).message)
    } finally {
      setSavingDescription(false)
    }
  }

  function handleDescriptionCancel() {
    setDescriptionDraft(issue?.description ?? "")
  }

  async function handleDelete() {
    if (!issue) return
    setDeleting(true)
    setUpdateError(null)
    try {
      await api.delete(`/issues/${issue.id}`)
      onDeleted(issue.id)
      setDeleteOpen(false)
      onOpenChange(false)
    } catch (err) {
      setUpdateError((err as Error).message)
      setDeleting(false)
    }
  }

  function handleShare() {
    if (!issue) return
    const url = new URL(window.location.href)
    url.searchParams.set("issue", issue.id)
    navigator.clipboard.writeText(url.toString()).then(() => {
      setCopied(true)
      if (copyTimeout.current) clearTimeout(copyTimeout.current)
      copyTimeout.current = setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[85vh] w-full max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl"
      >
          <div className="flex shrink-0 items-center justify-between gap-2 border-b px-4 py-2.5">
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={!previousIssue}
                      onClick={() => previousIssue && onNavigate(previousIssue.id)}
                    />
                  }
                >
                  <ChevronUp />
                  <span className="sr-only">Previous task</span>
                </TooltipTrigger>
                <TooltipContent>Previous task</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={!nextIssue}
                      onClick={() => nextIssue && onNavigate(nextIssue.id)}
                    />
                  }
                >
                  <ChevronDown />
                  <span className="sr-only">Next task</span>
                </TooltipTrigger>
                <TooltipContent>Next task</TooltipContent>
              </Tooltip>
            </div>

            <div className="flex items-center gap-1">
              {issue && (
                <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                  <AlertDialogTrigger
                    render={
                      <Button variant="ghost" size="icon-sm" disabled={deleting} />
                    }
                  >
                    <Trash2 />
                    <span className="sr-only">Delete task</span>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete task?</AlertDialogTitle>
                      <AlertDialogDescription>
                        &quot;{issue.title}&quot; and its attachments and
                        history will be permanently deleted. This can&apos;t
                        be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction variant="destructive" onClick={handleDelete}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Button variant="outline" size="sm" onClick={handleShare} disabled={!issue}>
                {copied ? <Check /> : <LinkIcon />}
                {copied ? "Copied!" : "Share"}
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => onOpenChange(false)}>
                <XIcon />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </div>

          {loading && !issue ? (
            <div className="flex flex-1 items-center justify-center">
              <Spinner className="size-6 text-muted-foreground" />
            </div>
          ) : error || !issue ? (
            <div className="flex flex-1 items-center justify-center">
              <Empty className="border-0">
                <EmptyMedia variant="icon">
                  <History />
                </EmptyMedia>
                <EmptyTitle>Couldn&apos;t load this task</EmptyTitle>
                <EmptyDescription>
                  {error ?? "This task may have been deleted."}
                </EmptyDescription>
              </Empty>
            </div>
          ) : (
            <div key={issue.id} className="flex min-h-0 flex-1">
              <div className="flex min-w-0 flex-1 flex-col gap-5 overflow-y-auto p-6">
                {updateError && (
                  <Alert variant="destructive">
                    <CircleAlert />
                    <AlertDescription>{updateError}</AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col gap-3">
                  <IssueFieldMenu
                    value={issue.type}
                    options={ISSUE_TYPES}
                    disabled={updatingField === "type"}
                    onValueChange={(v) => {
                      if (v !== issue.type) updateIssue("type", v)
                    }}
                  >
                    <IssueTypeBadge type={issue.type} className="w-fit" />
                  </IssueFieldMenu>

                  <input
                    type="text"
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onBlur={handleTitleSave}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur()
                    }}
                    className="-mx-1 rounded-md border-b border-transparent bg-transparent px-1 text-2xl font-semibold tracking-tight outline-none hover:bg-muted/40 focus-visible:border-b-border focus-visible:bg-muted/40"
                  />
                </div>

                <div className="flex flex-col gap-3 border-y py-4">
                  <PropertyRow icon={<CircleDot className="size-4" />} label="Status">
                    <div className="flex items-center gap-1">
                      <IssueStatusMenu
                        status={issue.status}
                        statuses={statuses}
                        disabled={updatingField === "status_id"}
                        onValueChange={(v) => updateIssue("status_id", v)}
                      >
                        <span className="rounded-md border px-2 py-1 text-xs font-medium">
                          {issue.status.name}
                        </span>
                      </IssueStatusMenu>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              disabled={!nextStatus || updatingField === "status_id"}
                              onClick={() => nextStatus && updateIssue("status_id", nextStatus.id)}
                            />
                          }
                        >
                          <ChevronRight />
                          <span className="sr-only">
                            Move to next status{nextStatus ? ` (${nextStatus.name})` : ""}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {nextStatus ? `Move to "${nextStatus.name}"` : "Already at the last status"}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </PropertyRow>

                  <PropertyRow icon={<UserRound className="size-4" />} label="Assignees">
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
                      onValueChange={(v) =>
                        updateIssue("assigned_to", v === "unassigned" ? null : v)
                      }
                    >
                      {issue.assignee ? (
                        <div className="flex items-center gap-2">
                          <Avatar size="sm">
                            <AvatarImage src={issue.assignee.avatar_url} />
                            <AvatarFallback>
                              {initials(issue.assignee.name, issue.assignee.email)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{issue.assignee.name ?? issue.assignee.email}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </IssueFieldMenu>
                  </PropertyRow>

                  <PropertyRow icon={<Flag className="size-4" />} label="Priority">
                    <IssueFieldMenu
                      value={issue.priority}
                      options={ISSUE_PRIORITIES}
                      disabled={updatingField === "priority"}
                      onValueChange={(v) => {
                        if (v !== issue.priority) updateIssue("priority", v)
                      }}
                    >
                      <IssuePriorityBadge priority={issue.priority} className="w-fit" />
                    </IssueFieldMenu>
                  </PropertyRow>

                  {issue.type === "bug" && (
                    <PropertyRow icon={<AlertTriangle className="size-4" />} label="Severity">
                      <IssueFieldMenu
                        value={issue.severity ?? "medium"}
                        options={ISSUE_SEVERITIES}
                        disabled={updatingField === "severity"}
                        onValueChange={(v) => {
                          if (v !== issue.severity) updateIssue("severity", v)
                        }}
                      >
                        <IssueSeverityBadge severity={issue.severity} className="w-fit" />
                      </IssueFieldMenu>
                    </PropertyRow>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Description
                  </span>
                  <Textarea
                    value={descriptionDraft}
                    onChange={(e) => setDescriptionDraft(e.target.value)}
                    placeholder="Add description..."
                    rows={5}
                    className="rounded-md border-transparent bg-transparent px-1 hover:bg-muted/40 focus-visible:border-border focus-visible:bg-muted/40 focus-visible:ring-0 dark:bg-transparent dark:hover:bg-muted/40"
                  />
                  {descriptionDirty && (
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDescriptionCancel}
                        disabled={savingDescription}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleDescriptionSave}
                        disabled={savingDescription}
                      >
                        {savingDescription && <Spinner />}
                        Save
                      </Button>
                    </div>
                  )}
                </div>

                <Separator />

                <IssueAttachments
                  issueId={issue.id}
                  initialAttachments={issue.attachments}
                />

                <div className="text-xs text-muted-foreground">
                  Created {new Date(issue.created_at).toLocaleString()} by{" "}
                  {issue.reporter.name ?? issue.reporter.email}
                </div>
              </div>

              <div className="flex w-72 shrink-0 flex-col gap-3 overflow-y-auto border-l bg-background p-4">
                <span className="text-xs font-medium text-muted-foreground">Activity</span>
                <IssueActivity
                  history={issue.history}
                  attachments={issue.attachments}
                  workspaceMembers={workspaceMembers}
                  currentUserId={user?.id}
                />
              </div>
            </div>
          )}
      </DialogContent>
    </Dialog>
  )
}
