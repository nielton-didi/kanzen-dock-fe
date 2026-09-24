export interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export type WorkspaceRole = "owner" | "admin" | "member"

export interface WorkspaceMember {
  id: string
  workspace_id: string
  user_id: string
  role: WorkspaceRole
  user: User
  added_at: string
}

export interface Workspace {
  id: string
  name: string
  owner_id: string
  owner: User
  members: WorkspaceMember[]
  // Nested projects never carry their own `lists` - fetch those separately
  // via GET /projects/:projectId/lists.
  projects: Project[]
  created_at: string
  updated_at: string
}

export function getWorkspaceRole(
  workspace: Workspace,
  userId?: string | null
): WorkspaceRole | null {
  if (!userId) return null
  if (workspace.owner_id === userId) return "owner"
  return workspace.members.find((m) => m.user_id === userId)?.role ?? null
}

export interface Project {
  id: string
  name: string
  workspace_id: string
  created_by: string
  creator: User
  created_at: string
  updated_at: string
}

export interface List {
  id: string
  name: string
  project_id: string
  created_at: string
  updated_at: string
}

export type WorkItemPriority = "urgent" | "high" | "medium" | "low" | "none"

export type StatusCategory = "not_started" | "active" | "done" | "closed"
export type StatusColor =
  | "gray"
  | "blue"
  | "teal"
  | "green"
  | "lime"
  | "yellow"
  | "orange"
  | "red"
  | "magenta"
  | "purple"

export interface Status {
  id: string
  list_id: string
  name: string
  category: StatusCategory
  color: StatusColor
  position: number
  created_at: string
  updated_at: string
}

export type FieldKind =
  | "text"
  | "number"
  | "dropdown"
  | "multi_select"
  | "date"
  | "person"
  | "checkbox"
  | "url"

/** A dropdown / multi_select choice. Work items store the `id`, never the label. */
export interface FieldOption {
  id: string
  label: string
  color: StatusColor
}

/** A per-list custom field (GET /lists/:listId/custom-fields). */
export interface FieldDefinition {
  id: string
  list_id: string
  name: string
  kind: FieldKind
  /** Only dropdown / multi_select have options; `[]` for every other kind. */
  options: FieldOption[]
  position: number
  /** Set when the field is soft-deleted (only listed with `?deleted=true`). */
  deleted_at: string | null
  created_at: string
  updated_at: string
}

/** A stored custom field value: text/url/date (`YYYY-MM-DD`)/dropdown option
 * id/person user id → string, number → number, checkbox → `true`,
 * multi_select → option ids. Unset is always "key absent", never null. */
export type CustomFieldValue = string | number | boolean | string[]

/** A list preset from GET /list-templates (D3), copied into a list on create. */
export interface ListTemplate {
  key: string
  name: string
  description: string
  /** A lucide icon name (kebab-case). */
  icon: string
  statuses: { name: string; category: StatusCategory; color: StatusColor }[]
  /** Template options have no ids: each list gets its own on create. */
  fields: {
    name: string
    kind: FieldKind
    options?: { label: string; color?: StatusColor }[]
  }[]
  defaultView: { type: "list" | "board"; groupBy: "status" }
}

export interface Attachment {
  id: string
  work_item_id: string
  file_url: string
  file_name: string
  file_size?: number
  file_type?: string
  uploaded_by: string
  uploader: User
  uploaded_at: string
}

export interface WorkItemHistoryEntry {
  id: string
  work_item_id: string
  field_name: string
  old_value: string | null
  new_value: string | null
  changed_by: string
  changer: User
  changed_at: string
}

export interface WorkItem {
  id: string
  title: string
  description?: string
  list_id: string
  status_id: string
  status: Status
  priority: WorkItemPriority
  // Calendar days. The API returns midnight-UTC ISO strings; read them with
  // lib/dates.ts (`toDayKey`), never `new Date()`, or west-of-UTC users see
  // the previous day.
  start_date: string | null
  due_date: string | null
  assigned_to?: string | null
  /** Keyed by field id. Raw from the API: may hold keys for deleted fields,
   * removed options or ex-members — read it through `readFieldValue`. */
  custom_fields: Record<string, unknown>
  reported_by: string
  assignee?: User | null
  reporter: User
  attachments: Attachment[]
  // Only present on GET /work-items/:workItemId
  list?: List & { project: Project & { workspace: Workspace } }
  history?: WorkItemHistoryEntry[]
  created_at: string
  updated_at: string
}

/** Not in a done/closed status. Only open work is flagged as overdue. */
export function isOpenWork(workItem: WorkItem): boolean {
  return workItem.status.category !== "done" && workItem.status.category !== "closed"
}
