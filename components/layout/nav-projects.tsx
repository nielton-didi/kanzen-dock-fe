"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ChevronRight,
  FolderKanban,
  ListTodo,
  Plus,
  Trash2,
} from "lucide-react"

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
import { CreateListDialog } from "@/components/lists/create-list-dialog"
import { CreateProjectDialog } from "@/components/projects/create-project-dialog"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { useWorkspaceData } from "@/contexts/workspace-context"
import { useAuth } from "@/hooks/use-auth"
import { getWorkspaceRole, type Project } from "@/lib/types"

export function NavProjects() {
  const { activeWorkspace, loading } = useWorkspaceData()

  if (loading) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>Projects</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuSkeleton showIcon />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuSkeleton showIcon />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    )
  }

  if (!activeWorkspace) {
    return null
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Projects</SidebarGroupLabel>
      <CreateProjectDialog workspaceId={activeWorkspace.id}>
        <SidebarGroupAction title="Create project">
          <Plus />
          <span className="sr-only">Create project</span>
        </SidebarGroupAction>
      </CreateProjectDialog>
      <SidebarMenu>
        {activeWorkspace.projects.map((project) => (
          <ProjectNavItem key={project.id} project={project} />
        ))}
        {activeWorkspace.projects.length === 0 && (
          <SidebarMenuItem>
            <span className="px-2 py-1.5 text-xs text-subtle-foreground">
              No projects yet
            </span>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}

function ProjectNavItem({ project }: { project: Project }) {
  const pathname = usePathname()
  const { user } = useAuth()
  const { activeWorkspace, listsByProject, listsLoading, deleteProject } =
    useWorkspaceData()
  const lists = listsByProject[project.id]
  const isProjectRoute = pathname.startsWith(`/projects/${project.id}`)
  const role = activeWorkspace ? getWorkspaceRole(activeWorkspace, user?.id) : null
  const canDelete = role === "owner" || role === "admin"
  const [deleting, setDeleting] = React.useState(false)
  const [deleteError, setDeleteError] = React.useState<string | null>(null)

  async function handleDelete() {
    if (!activeWorkspace) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteProject(activeWorkspace.id, project.id)
    } catch (err) {
      setDeleteError((err as Error).message)
      setDeleting(false)
    }
  }

  // Controlled open state: initialized once from the current route, then
  // only ever forced open (never closed) when navigation enters this
  // project's routes, so manual collapse/expand isn't fought afterwards.
  // Reset is done during render (React's documented pattern for deriving
  // state from a changing value) rather than in an effect, so it takes
  // effect in the same commit instead of causing an extra render pass.
  const [open, setOpen] = React.useState(isProjectRoute)
  const [prevIsProjectRoute, setPrevIsProjectRoute] = React.useState(isProjectRoute)
  if (isProjectRoute !== prevIsProjectRoute) {
    setPrevIsProjectRoute(isProjectRoute)
    if (isProjectRoute) setOpen(true)
  }

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="group/collapsible"
      render={<SidebarMenuItem />}
    >
      <CollapsibleTrigger render={<SidebarMenuButton tooltip={project.name} />}>
        <FolderKanban />
        <span>{project.name}</span>
        <ChevronRight className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
      </CollapsibleTrigger>
      <CreateListDialog projectId={project.id}>
        <SidebarMenuAction showOnHover title="Create list">
          <Plus />
          <span className="sr-only">Create list</span>
        </SidebarMenuAction>
      </CreateListDialog>
      {canDelete && (
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <SidebarMenuAction
                showOnHover
                className="right-7"
                title="Delete project"
                disabled={deleting}
              >
                <Trash2 />
                <span className="sr-only">Delete project</span>
              </SidebarMenuAction>
            }
          />
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete project?</AlertDialogTitle>
              <AlertDialogDescription>
                &quot;{project.name}&quot; and all of its lists, workItems,
                attachments, and history will be permanently deleted. This
                can&apos;t be undone.
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
      <CollapsibleContent>
        <SidebarMenuSub>
          {deleteError && (
            <SidebarMenuSubItem>
              <span className="px-2 py-1 text-xs text-destructive">
                {deleteError}
              </span>
            </SidebarMenuSubItem>
          )}
          {!lists && listsLoading && (
            <SidebarMenuSubItem>
              <SidebarMenuSkeleton />
            </SidebarMenuSubItem>
          )}
          {lists?.length === 0 && (
            <SidebarMenuSubItem>
              <span className="px-2 py-1 text-xs text-subtle-foreground">
                No lists yet
              </span>
            </SidebarMenuSubItem>
          )}
          {lists?.map((list) => {
            const href = `/projects/${project.id}/lists/${list.id}`
            const isActive = pathname === href

            return (
              <SidebarMenuSubItem key={list.id}>
                <SidebarMenuSubButton isActive={isActive} render={<Link href={href} />}>
                  <ListTodo />
                  <span className="flex-1 truncate">{list.name}</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            )
          })}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  )
}
