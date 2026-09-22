"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, CircleAlert, History, Trash2 } from "lucide-react"

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
import { IssueAttachments } from "@/components/issues/issue-attachments"
import {
  ISSUE_PRIORITIES,
  ISSUE_SEVERITIES,
  ISSUE_TYPES,
} from "@/components/issues/issue-badges"
import { PageHeader } from "@/components/layout/page-header"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import {
  Item,
  ItemContent,
  ItemDescription,
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
import { useListStatuses } from "@/hooks/use-list-statuses"
import { api } from "@/lib/api"
import type { Issue } from "@/lib/types"

function formatFieldName(field: string) {
  return field
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase())
}

function formatValue(field: string, value: string | null) {
  if (value === null) return "none"
  if (field === "type") {
    return ISSUE_TYPES.find((t) => t.value === value)?.label ?? value
  }
  // status history is stored as a plain-text status name already, not a value to look up.
  if (field === "severity") {
    return ISSUE_SEVERITIES.find((s) => s.value === value)?.label ?? value
  }
  if (field === "priority") {
    return ISSUE_PRIORITIES.find((p) => p.value === value)?.label ?? value
  }
  return value
}

function initials(name?: string, email?: string) {
  return (name ?? email ?? "?").charAt(0).toUpperCase()
}

export default function IssueDetailPage() {
  const { projectId, listId, issueId } = useParams<{
    projectId: string
    listId: string
    issueId: string
  }>()
  const { workspaces } = useWorkspaceData()
  const router = useRouter()
  const { statuses } = useListStatuses(listId)

  const [issue, setIssue] = useState<Issue | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [updatingField, setUpdatingField] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.resolve()
      .then(() => {
        if (cancelled) return undefined
        setLoading(true)
        setError(null)
        return api.get<Issue>(`/issues/${issueId}`)
      })
      .then((data) => {
        if (!cancelled && data) setIssue(data)
      })
      .catch((err) => {
        if (!cancelled) setError((err as Error).message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [issueId])

  async function updateIssue(field: string, value: string | null) {
    if (!issue) return
    setUpdatingField(field)
    setUpdateError(null)
    try {
      await api.put<Issue>(`/issues/${issue.id}`, { [field]: value })
      // The PUT response doesn't include the nested `list`/`history` this
      // page needs, and the update also logs a new history entry - so
      // refetch the full detail response instead of merging the partial one.
      const fresh = await api.get<Issue>(`/issues/${issue.id}`)
      setIssue(fresh)
    } catch (err) {
      setUpdateError((err as Error).message)
    } finally {
      setUpdatingField(null)
    }
  }

  async function handleDelete() {
    if (!issue) return
    setDeleting(true)
    setUpdateError(null)
    try {
      await api.delete(`/issues/${issue.id}`)
      router.push(`/projects/${projectId}/lists/${listId}`)
    } catch (err) {
      setUpdateError((err as Error).message)
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    )
  }

  if (error || !issue) {
    return (
      <div className="flex w-full flex-1 flex-col gap-4">
        <PageHeader title="Issue not found" />
        <Card className="flex-1">
          <CardContent className="flex flex-1 items-center justify-center py-16">
            <Empty className="border-0">
              <EmptyMedia variant="icon">
                <History />
              </EmptyMedia>
              <EmptyTitle>Couldn&apos;t load this issue</EmptyTitle>
              <EmptyDescription>
                {error ?? "This issue may have been deleted."}
              </EmptyDescription>
            </Empty>
          </CardContent>
        </Card>
      </div>
    )
  }

  const workspace = issue.list
    ? workspaces.find((w) => w.id === issue.list?.project.workspace.id)
    : undefined

  return (
    <div className="flex w-full flex-1 flex-col gap-4">
      <Link
        href={`/projects/${projectId}/lists/${listId}`}
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to {issue.list?.name ?? "list"}
      </Link>

      <PageHeader
        title={issue.title}
        description={
          issue.list
            ? `${issue.list.project.workspace.name} / ${issue.list.project.name} / ${issue.list.name}`
            : undefined
        }
        actions={
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button variant="outline" disabled={deleting}>
                  <Trash2 />
                  Delete issue
                </Button>
              }
            />
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete issue?</AlertDialogTitle>
                <AlertDialogDescription>
                  &quot;{issue.title}&quot; and its attachments and history
                  will be permanently deleted. This can&apos;t be undone.
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
        }
      />

      {updateError && (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertDescription>{updateError}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {issue.description || "No description provided."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
            </CardHeader>
            <CardContent>
              <IssueAttachments
                issueId={issue.id}
                initialAttachments={issue.attachments}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>History</CardTitle>
            </CardHeader>
            <CardContent>
              {!issue.history || issue.history.length === 0 ? (
                <p className="text-sm text-muted-foreground">No history yet.</p>
              ) : (
                <ItemGroup>
                  {issue.history.map((entry) => (
                    <Item key={entry.id} variant="muted" size="sm">
                      <ItemMedia>
                        <Avatar size="sm">
                          <AvatarImage src={entry.changer.avatar_url} />
                          <AvatarFallback>
                            {initials(entry.changer.name, entry.changer.email)}
                          </AvatarFallback>
                        </Avatar>
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle>
                          {entry.changer.name ?? entry.changer.email}{" "}
                          {entry.field_name === "created" ? (
                            "created this issue"
                          ) : (
                            <>
                              changed {formatFieldName(entry.field_name)} from{" "}
                              {formatValue(entry.field_name, entry.old_value)} to{" "}
                              {formatValue(entry.field_name, entry.new_value)}
                            </>
                          )}
                        </ItemTitle>
                        <ItemDescription>
                          {new Date(entry.changed_at).toLocaleString()}
                        </ItemDescription>
                      </ItemContent>
                    </Item>
                  ))}
                </ItemGroup>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Properties</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <PropertyField label="Type">
                <Select
                  value={issue.type}
                  disabled={updatingField === "type"}
                  onValueChange={(v) => updateIssue("type", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ISSUE_TYPES.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </PropertyField>

              <PropertyField label="Status">
                <Select
                  value={issue.status_id}
                  disabled={updatingField === "status_id"}
                  onValueChange={(v) => updateIssue("status_id", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status.id} value={status.id}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </PropertyField>

              {issue.type === "bug" && (
                <PropertyField label="Severity">
                  <Select
                    value={issue.severity ?? "medium"}
                    disabled={updatingField === "severity"}
                    onValueChange={(v) => updateIssue("severity", v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ISSUE_SEVERITIES.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </PropertyField>
              )}

              <PropertyField label="Priority">
                <Select
                  value={issue.priority}
                  disabled={updatingField === "priority"}
                  onValueChange={(v) => updateIssue("priority", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ISSUE_PRIORITIES.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </PropertyField>

              {workspace && (
                <PropertyField label="Assignee">
                  <Select
                    value={issue.assigned_to ?? "unassigned"}
                    disabled={updatingField === "assigned_to"}
                    onValueChange={(v) =>
                      updateIssue("assigned_to", v === "unassigned" ? null : v)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {workspace.members.map((member) => (
                        <SelectItem key={member.user_id} value={member.user_id}>
                          {member.user.name ?? member.user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </PropertyField>
              )}

              <PropertyField label="Reporter">
                <div className="flex items-center gap-2 text-sm">
                  <Avatar size="sm">
                    <AvatarImage src={issue.reporter.avatar_url} />
                    <AvatarFallback>
                      {initials(issue.reporter.name, issue.reporter.email)}
                    </AvatarFallback>
                  </Avatar>
                  {issue.reporter.name ?? issue.reporter.email}
                </div>
              </PropertyField>

              <PropertyField label="Created">
                <span className="text-sm text-muted-foreground">
                  {new Date(issue.created_at).toLocaleString()}
                </span>
              </PropertyField>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function PropertyField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}
