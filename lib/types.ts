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

export type WorkItemType = "bug" | "task"
export type WorkItemSeverity = "critical" | "high" | "medium" | "low"
export type WorkItemPriority = "high" | "medium" | "low"

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
  type: WorkItemType
  status_id: string
  status: Status
  // Only valid (non-null) when `type` is "bug".
  severity: WorkItemSeverity | null
  priority: WorkItemPriority
  assigned_to?: string | null
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
