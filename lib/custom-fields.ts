import { formatDay } from "@/lib/dates"
import type { CustomFieldValue, FieldDefinition, FieldKind, WorkspaceMember } from "@/lib/types"

// Pure helpers for custom field values (D2). Everything that reads
// `WorkItem.custom_fields` goes through `readFieldValue`, so stale keys the
// backend doesn't clean up (removed options, ex-members) never reach the UI.

/** Kinds the list endpoint can filter by (`cf=<fieldId>:<value>`). */
export const FILTERABLE_FIELD_KINDS: readonly FieldKind[] = [
  "dropdown",
  "multi_select",
  "person",
  "checkbox",
]

/** Mirrors the backend's limits so users see the error before the 400. */
const MAX_TEXT_LENGTH = 10_000
const MAX_URL_LENGTH = 2048
const DAY_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function isFilterableKind(kind: FieldKind): boolean {
  return FILTERABLE_FIELD_KINDS.includes(kind)
}

/**
 * Raw stored value → the value to show, or `null` when unset. Drops what the
 * backend leaves behind: unknown option ids, person values for users who are
 * no longer workspace members, and anything of the wrong shape.
 */
export function readFieldValue(
  field: FieldDefinition,
  raw: unknown,
  members: WorkspaceMember[]
): CustomFieldValue | null {
  if (raw === undefined || raw === null) return null

  switch (field.kind) {
    case "text":
      return typeof raw === "string" && raw !== "" ? raw : null
    case "number":
      return typeof raw === "number" && Number.isFinite(raw) ? raw : null
    case "dropdown":
      return typeof raw === "string" && field.options.some((o) => o.id === raw) ? raw : null
    case "multi_select": {
      if (!Array.isArray(raw)) return null
      // Keep the field's option order, not the order they were picked in.
      const ids = field.options.filter((o) => raw.includes(o.id)).map((o) => o.id)
      return ids.length > 0 ? ids : null
    }
    case "date":
      return typeof raw === "string" && DAY_KEY_PATTERN.test(raw) ? raw : null
    case "person":
      return typeof raw === "string" && members.some((m) => m.user_id === raw) ? raw : null
    case "checkbox":
      return raw === true ? true : null
    case "url":
      return typeof raw === "string" && raw !== "" ? raw : null
  }
}

/** Empty values unset the field on the backend; send `null` for them. */
export function toPayloadValue(value: CustomFieldValue | null): CustomFieldValue | null {
  if (value === null || value === "" || value === false) return null
  if (Array.isArray(value) && value.length === 0) return null
  return value
}

/** Adds `https://` when the user typed a bare domain ("example.com/x"). */
export function normalizeUrl(input: string): string {
  const value = input.trim()
  if (value === "" || /^[a-z][a-z\d+.-]*:/i.test(value)) return value
  return `https://${value}`
}

function isHttpUrl(value: string): boolean {
  // Browsers' URL parser escapes spaces in the host ("https://a b" parses),
  // while the backend (Node) rejects them, so check whitespace explicitly.
  if (/\s/.test(value)) return false
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

/** A user-facing validation message, or `null` when the value can be saved. */
export function fieldValueError(
  field: FieldDefinition,
  value: CustomFieldValue | null
): string | null {
  if (value === null) return null
  if (field.kind === "text" && typeof value === "string" && value.length > MAX_TEXT_LENGTH) {
    return `Must be at most ${MAX_TEXT_LENGTH.toLocaleString()} characters`
  }
  if (field.kind === "number" && (typeof value !== "number" || !Number.isFinite(value))) {
    return "Enter a number"
  }
  if (field.kind === "url" && typeof value === "string" && value !== "") {
    if (value.length > MAX_URL_LENGTH || !isHttpUrl(value)) {
      return "Enter a valid http(s) URL"
    }
  }
  return null
}

/** Repeated `cf=<fieldId>:<value>` pairs for GET /lists/:listId/work-items.
 * Values for the same field are OR'd by the backend, fields are AND'd. */
export function customFieldFilterParams(filters: Record<string, string[]>): string[] {
  return Object.entries(filters).flatMap(([fieldId, values]) =>
    values.map((value) => `${fieldId}:${value}`)
  )
}

export function memberLabel(member: WorkspaceMember): string {
  return member.user.name ?? member.user.email
}

// --- History (`field_name = "cf:<fieldId>"`, values JSON-encoded) ---

const HISTORY_PREFIX = "cf:"

/** `"cf:<fieldId>"` → field id; `null` for built-in history rows. */
export function customFieldHistoryId(fieldName: string): string | null {
  return fieldName.startsWith(HISTORY_PREFIX) ? fieldName.slice(HISTORY_PREFIX.length) : null
}

function parseHistoryValue(value: string | null): unknown {
  if (value === null) return null
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

const MAX_HISTORY_TEXT = 60

function truncate(value: string): string {
  return value.length > MAX_HISTORY_TEXT ? `${value.slice(0, MAX_HISTORY_TEXT - 1)}…` : value
}

/**
 * One side of a `cf:` history row as text, or `null` when that side is unset.
 * Resolves option and person ids through the current definitions; ids that no
 * longer exist read as "deleted option" / "a former member" instead of an id.
 */
export function formatHistoryValue(
  field: FieldDefinition,
  encoded: string | null,
  members: WorkspaceMember[]
): string | null {
  const value = parseHistoryValue(encoded)
  if (value === null) return null

  const optionLabel = (id: unknown) =>
    field.options.find((o) => o.id === id)?.label ?? "deleted option"

  switch (field.kind) {
    case "dropdown":
      return optionLabel(value)
    case "multi_select":
      return Array.isArray(value) ? value.map(optionLabel).join(", ") : null
    case "person": {
      const member = members.find((m) => m.user_id === value)
      return member ? memberLabel(member) : "a former member"
    }
    case "date":
      return typeof value === "string" && DAY_KEY_PATTERN.test(value) ? formatDay(value) : String(value)
    case "checkbox":
      return value === true ? "checked" : null
    case "number":
      return typeof value === "number" ? value.toLocaleString() : String(value)
    case "text":
      return `"${truncate(String(value))}"`
    case "url":
      return truncate(String(value))
  }
}
