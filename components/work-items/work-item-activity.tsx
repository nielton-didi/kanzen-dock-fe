import { FileIcon } from "lucide-react"

import {
  WORK_ITEM_PRIORITIES,
  WORK_ITEM_SEVERITIES,
  WORK_ITEM_TYPES,
} from "@/components/work-items/work-item-badges"
import { customFieldHistoryId, formatHistoryValue } from "@/lib/custom-fields"
import { formatDay } from "@/lib/dates"
import type {
  Attachment,
  FieldDefinition,
  WorkItemHistoryEntry,
  User,
  WorkspaceMember,
} from "@/lib/types"

function formatFieldName(field: string) {
  return field.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())
}

function formatRelativeTime(dateStr: string) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(dateStr).getTime()) / 60000))
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"}`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"}`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? "" : "s"}`
}

// The backend doesn't always populate the changer/uploader relation (e.g. a
// user removed from the workspace after acting), so this stays defensive
// even though the type says `User` is always present.
function actorLabel(user: User | null | undefined, currentUserId?: string) {
  if (!user) return "Someone"
  if (user.id === currentUserId) return "You"
  return user.name ?? user.email
}

function resolveUserLabel(
  userId: string | null,
  currentUserId: string | undefined,
  workspaceMembers: WorkspaceMember[]
) {
  if (!userId) return "no one"
  if (userId === currentUserId) return "You"
  const member = workspaceMembers.find((m) => m.user_id === userId)
  return member ? member.user.name ?? member.user.email : userId
}

function formatValue(field: string, value: string | null) {
  if (value === null) return "none"
  if (field === "type") {
    return WORK_ITEM_TYPES.find((t) => t.value === value)?.label ?? value
  }
  // status history is stored as a plain-text status name already, not a value to look up.
  if (field === "severity") {
    return WORK_ITEM_SEVERITIES.find((s) => s.value === value)?.label ?? value
  }
  if (field === "priority") {
    return WORK_ITEM_PRIORITIES.find((p) => p.value === value)?.label ?? value
  }
  // Stored as YYYY-MM-DD calendar days.
  if (field === "start_date" || field === "due_date") return formatDay(value)
  return value
}

/** `cf:<fieldId>` rows: values are JSON-encoded ids, resolved through the
 * list's current field definitions. */
function customFieldHistoryText(
  actor: string,
  field: FieldDefinition | undefined,
  entry: WorkItemHistoryEntry,
  workspaceMembers: WorkspaceMember[]
) {
  // Deleted fields aren't in the definitions any more (P0-4 soft-deletes them).
  if (!field) return `${actor} changed a deleted field`
  if (field.kind === "checkbox") {
    return `${actor} ${entry.new_value === "true" ? "checked" : "unchecked"} ${field.name}`
  }
  const from = formatHistoryValue(field, entry.old_value, workspaceMembers)
  const to = formatHistoryValue(field, entry.new_value, workspaceMembers)
  if (to === null) return `${actor} cleared ${field.name}`
  if (from === null) return `${actor} set ${field.name} to ${to}`
  return `${actor} changed ${field.name} from ${from} to ${to}`
}

function historyText(
  entry: WorkItemHistoryEntry,
  fields: FieldDefinition[],
  currentUserId: string | undefined,
  workspaceMembers: WorkspaceMember[]
) {
  const actor = actorLabel(entry.changer, currentUserId)
  if (entry.field_name === "created") return `${actor} created this work item`
  const fieldId = customFieldHistoryId(entry.field_name)
  if (fieldId !== null) {
    const field = fields.find((f) => f.id === fieldId)
    return customFieldHistoryText(actor, field, entry, workspaceMembers)
  }
  if (entry.field_name === "assigned_to") {
    if (!entry.new_value) return `${actor} unassigned this work item`
    return `${actor} assigned this to ${resolveUserLabel(entry.new_value, currentUserId, workspaceMembers)}`
  }
  return `${actor} changed ${formatFieldName(entry.field_name)} from ${formatValue(
    entry.field_name,
    entry.old_value
  )} to ${formatValue(entry.field_name, entry.new_value)}`
}

type ActivityItem =
  | { id: string; timestamp: string; kind: "history"; entry: WorkItemHistoryEntry }
  | { id: string; timestamp: string; kind: "attachment"; attachment: Attachment }

export function WorkItemActivity({
  history,
  attachments,
  fields,
  workspaceMembers,
  currentUserId,
}: {
  history?: WorkItemHistoryEntry[]
  attachments: Attachment[]
  fields: FieldDefinition[]
  workspaceMembers: WorkspaceMember[]
  currentUserId?: string
}) {
  const items: ActivityItem[] = [
    ...(history ?? []).map((entry) => ({
      id: `h-${entry.id}`,
      timestamp: entry.changed_at,
      kind: "history" as const,
      entry,
    })),
    ...attachments.map((attachment) => ({
      id: `a-${attachment.id}`,
      timestamp: attachment.uploaded_at,
      kind: "attachment" as const,
      attachment,
    })),
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground">No activity yet.</p>
  }

  return (
    <div className="flex flex-col gap-3 text-xs">
      {items.map((item) => (
        <div key={item.id} className="flex flex-col gap-1.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2 text-muted-foreground">
              <span className="mt-1.5 size-1 shrink-0 rounded-full bg-subtle-foreground" />
              <span>
                {item.kind === "history"
                  ? historyText(item.entry, fields, currentUserId, workspaceMembers)
                  : `${actorLabel(item.attachment.uploader, currentUserId)} uploaded a file`}
              </span>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {formatRelativeTime(item.timestamp)}
            </span>
          </div>
          {item.kind === "attachment" && (
            <div className="ml-3 flex w-28 flex-col gap-1">
              <div className="flex h-16 w-28 items-center justify-center overflow-hidden rounded-md border bg-muted/40">
                {item.attachment.file_type?.startsWith("image") ? (
                  // Small in-feed preview, not user-facing content that needs
                  // Next/Image's optimization - a plain <img> keeps this
                  // decoupled from remote-pattern config for arbitrary hosts.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.attachment.file_url}
                    alt={item.attachment.file_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <FileIcon className="size-5 text-muted-foreground" />
                )}
              </div>
              <span className="truncate text-xs text-muted-foreground">
                {item.attachment.file_name}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
