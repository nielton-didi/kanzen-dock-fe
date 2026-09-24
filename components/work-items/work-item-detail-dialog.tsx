"use client"

import { useEffect, useRef, useState } from "react"
import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
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
  WORK_ITEM_PRIORITY_OPTIONS,
  WORK_ITEM_SEVERITIES,
  WORK_ITEM_TYPES,
  WorkItemPriorityLabel,
  WorkItemSeverityBadge,
  WorkItemTypeBadge,
} from "@/components/work-items/work-item-badges"
import { WorkItemActivity } from "@/components/work-items/work-item-activity"
import { WorkItemAttachments } from "@/components/work-items/work-item-attachments"
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
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuth } from "@/hooks/use-auth"
import { useWorkItem } from "@/hooks/use-work-item"
import { api } from "@/lib/api"
import { toDayKey } from "@/lib/dates"
import { isOpenWork, type WorkItem, type Status, type WorkspaceMember } from "@/lib/types"

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

export function WorkItemDetailDialog({
  workItemId,
  workItems,
  statuses,
  workspaceMembers,
  onOpenChange,
  onNavigate,
  onUpdated,
  onDeleted,
}: {
  /** The currently open work item's id, or null when the dialog is closed. */
  workItemId: string | null
  /** The visually-ordered list of work items on the page, used for the
   * prev/next chevrons - must be in the same order they're rendered in. */
  workItems: WorkItem[]
  statuses: Status[]
  workspaceMembers: WorkspaceMember[]
  onOpenChange: (open: boolean) => void
  onNavigate: (workItemId: string) => void
  onUpdated: (workItem: WorkItem) => void
  onDeleted: (workItemId: string) => void
}) {
  const { workItem, setWorkItem, loading, error } = useWorkItem(workItemId ?? undefined)
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
      setTitleDraft(workItem?.title ?? "")
      setDescriptionDraft(workItem?.description ?? "")
    })
    return () => {
      cancelled = true
    }
  }, [workItem?.id, workItem?.title, workItem?.description])

  const descriptionDirty = workItem !== null && descriptionDraft !== (workItem.description ?? "")

  useEffect(() => {
    return () => {
      if (copyTimeout.current) clearTimeout(copyTimeout.current)
    }
  }, [])

  const open = workItemId !== null

  const currentIndex = workItem ? workItems.findIndex((i) => i.id === workItem.id) : -1
  const previousWorkItem = currentIndex > 0 ? workItems[currentIndex - 1] : null
  const nextWorkItem =
    currentIndex >= 0 && currentIndex < workItems.length - 1
      ? workItems[currentIndex + 1]
      : null

  const statusIndex = workItem ? statuses.findIndex((s) => s.id === workItem.status_id) : -1
  const nextStatus =
    statusIndex >= 0 && statusIndex < statuses.length - 1
      ? statuses[statusIndex + 1]
      : null

  async function updateWorkItem(field: string, value: string | null) {
    if (!workItem) return
    setUpdatingField(field)
    setUpdateError(null)
    try {
      await api.put<WorkItem>(`/work-items/${workItem.id}`, { [field]: value })
      // The PUT response doesn't include the nested `list`/`history` this
      // dialog needs, and the update also logs a new history entry - so
      // refetch the full detail response instead of merging the partial one.
      const fresh = await api.get<WorkItem>(`/work-items/${workItem.id}`)
      setWorkItem(fresh)
      onUpdated(fresh)
    } catch (err) {
      setUpdateError((err as Error).message)
    } finally {
      setUpdatingField(null)
    }
  }

  async function handleTitleSave() {
    const next = titleDraft.trim()
    if (!workItem || !next || next === workItem.title) {
      setTitleDraft(workItem?.title ?? "")
      return
    }
    await updateWorkItem("title", next)
  }

  async function handleDescriptionSave() {
    if (!workItem) return
    setSavingDescription(true)
    setUpdateError(null)
    try {
      const next = descriptionDraft.trim()
      await api.put<WorkItem>(`/work-items/${workItem.id}`, { description: next || null })
      const fresh = await api.get<WorkItem>(`/work-items/${workItem.id}`)
      setWorkItem(fresh)
      onUpdated(fresh)
    } catch (err) {
      setUpdateError((err as Error).message)
    } finally {
      setSavingDescription(false)
    }
  }

  function handleDescriptionCancel() {
    setDescriptionDraft(workItem?.description ?? "")
  }

  async function handleDelete() {
    if (!workItem) return
    setDeleting(true)
    setUpdateError(null)
    try {
      await api.delete(`/work-items/${workItem.id}`)
      onDeleted(workItem.id)
      setDeleteOpen(false)
      onOpenChange(false)
    } catch (err) {
      setUpdateError((err as Error).message)
      setDeleting(false)
    }
  }

  function handleShare() {
    if (!workItem) return
    const url = new URL(window.location.href)
    url.searchParams.set("item", workItem.id)
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
                      disabled={!previousWorkItem}
                      onClick={() => previousWorkItem && onNavigate(previousWorkItem.id)}
                    />
                  }
                >
                  <ChevronUp />
                  <span className="sr-only">Previous work item</span>
                </TooltipTrigger>
                <TooltipContent>Previous work item</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={!nextWorkItem}
                      onClick={() => nextWorkItem && onNavigate(nextWorkItem.id)}
                    />
                  }
                >
                  <ChevronDown />
                  <span className="sr-only">Next work item</span>
                </TooltipTrigger>
                <TooltipContent>Next work item</TooltipContent>
              </Tooltip>
            </div>

            <div className="flex items-center gap-1">
              {workItem && (
                <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                  <AlertDialogTrigger
                    render={
                      <Button variant="ghost" size="icon-sm" disabled={deleting} />
                    }
                  >
                    <Trash2 />
                    <span className="sr-only">Delete work item</span>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete work item?</AlertDialogTitle>
                      <AlertDialogDescription>
                        &quot;{workItem.title}&quot; and its attachments and
                        history will be permanently deleted. This can&apos;t
                        be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction variant="danger" onClick={handleDelete}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Button variant="outline" size="sm" onClick={handleShare} disabled={!workItem}>
                {copied ? <Check /> : <LinkIcon />}
                {copied ? "Copied!" : "Share"}
              </Button>
              <Button variant="ghost" size="icon-sm" onClick={() => onOpenChange(false)}>
                <XIcon />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </div>

          {loading && !workItem ? (
            <div className="flex flex-1 items-center justify-center">
              <Spinner className="size-6 text-muted-foreground" />
            </div>
          ) : error || !workItem ? (
            <div className="flex flex-1 items-center justify-center">
              <Empty className="border-0">
                <EmptyMedia variant="icon">
                  <History />
                </EmptyMedia>
                <EmptyTitle>Couldn&apos;t load this work item</EmptyTitle>
                <EmptyDescription>
                  {error ?? "This work item may have been deleted."}
                </EmptyDescription>
              </Empty>
            </div>
          ) : (
            <div key={workItem.id} className="flex min-h-0 flex-1">
              <div className="flex min-w-0 flex-1 flex-col gap-5 overflow-y-auto p-6">
                {updateError && (
                  <Alert variant="destructive">
                    <CircleAlert />
                    <AlertDescription>{updateError}</AlertDescription>
                  </Alert>
                )}

                <div className="flex flex-col gap-3">
                  <WorkItemFieldMenu
                    value={workItem.type}
                    options={WORK_ITEM_TYPES}
                    disabled={updatingField === "type"}
                    onValueChange={(v) => {
                      if (v !== workItem.type) updateWorkItem("type", v)
                    }}
                  >
                    <WorkItemTypeBadge type={workItem.type} className="w-fit" />
                  </WorkItemFieldMenu>

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
                      <WorkItemStatusMenu
                        status={workItem.status}
                        statuses={statuses}
                        disabled={updatingField === "status_id"}
                        onValueChange={(v) => updateWorkItem("status_id", v)}
                      >
                        <span className="rounded-md border px-2 py-1 text-xs font-medium">
                          {workItem.status.name}
                        </span>
                      </WorkItemStatusMenu>
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              disabled={!nextStatus || updatingField === "status_id"}
                              onClick={() => nextStatus && updateWorkItem("status_id", nextStatus.id)}
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
                      onValueChange={(v) =>
                        updateWorkItem("assigned_to", v === "unassigned" ? null : v)
                      }
                    >
                      {workItem.assignee ? (
                        <div className="flex items-center gap-2">
                          <Avatar size="sm">
                            <AvatarImage src={workItem.assignee.avatar_url} />
                            <AvatarFallback>
                              {initials(workItem.assignee.name, workItem.assignee.email)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{workItem.assignee.name ?? workItem.assignee.email}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Unassigned</span>
                      )}
                    </WorkItemFieldMenu>
                  </PropertyRow>

                  <PropertyRow icon={<Flag className="size-4" />} label="Priority">
                    <WorkItemFieldMenu
                      value={workItem.priority}
                      options={WORK_ITEM_PRIORITY_OPTIONS}
                      disabled={updatingField === "priority"}
                      onValueChange={(v) => {
                        if (v !== workItem.priority) updateWorkItem("priority", v)
                      }}
                    >
                      <WorkItemPriorityLabel priority={workItem.priority} />
                    </WorkItemFieldMenu>
                  </PropertyRow>

                  <PropertyRow icon={<CalendarDays className="size-4" />} label="Start date">
                    <WorkItemDatePicker
                      label="Start date"
                      value={workItem.start_date ? toDayKey(workItem.start_date) : null}
                      max={workItem.due_date ? toDayKey(workItem.due_date) : null}
                      loading={updatingField === "start_date"}
                      onChange={(v) => updateWorkItem("start_date", v)}
                      placeholder={<span className="text-muted-foreground">Not set</span>}
                      className="-mx-1"
                    />
                  </PropertyRow>

                  <PropertyRow icon={<CalendarClock className="size-4" />} label="Due date">
                    <WorkItemDatePicker
                      label="Due date"
                      value={workItem.due_date ? toDayKey(workItem.due_date) : null}
                      min={workItem.start_date ? toDayKey(workItem.start_date) : null}
                      highlightDue={isOpenWork(workItem)}
                      loading={updatingField === "due_date"}
                      onChange={(v) => updateWorkItem("due_date", v)}
                      placeholder={<span className="text-muted-foreground">Not set</span>}
                      className="-mx-1"
                    />
                  </PropertyRow>

                  {workItem.type === "bug" && (
                    <PropertyRow icon={<AlertTriangle className="size-4" />} label="Severity">
                      <WorkItemFieldMenu
                        value={workItem.severity ?? "medium"}
                        options={WORK_ITEM_SEVERITIES}
                        disabled={updatingField === "severity"}
                        onValueChange={(v) => {
                          if (v !== workItem.severity) updateWorkItem("severity", v)
                        }}
                      >
                        <WorkItemSeverityBadge severity={workItem.severity} className="w-fit" />
                      </WorkItemFieldMenu>
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
                      <Button variant="primary"
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

                <WorkItemAttachments
                  workItemId={workItem.id}
                  initialAttachments={workItem.attachments}
                />

                <div className="text-xs text-muted-foreground">
                  Created {new Date(workItem.created_at).toLocaleString()} by{" "}
                  {workItem.reporter.name ?? workItem.reporter.email}
                </div>
              </div>

              <div className="flex w-72 shrink-0 flex-col gap-3 overflow-y-auto border-l bg-background p-4">
                <span className="text-xs font-medium text-muted-foreground">Activity</span>
                <WorkItemActivity
                  history={workItem.history}
                  attachments={workItem.attachments}
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
