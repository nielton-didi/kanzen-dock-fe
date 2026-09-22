"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Archive,
  Bug,
  ChevronRight,
  FolderKanban,
  ListTodo,
  Plus,
  Sparkles,
} from "lucide-react"

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
import type { List, Project } from "@/lib/types"

const listIcons: Record<List["type"], React.ComponentType<{ className?: string }>> = {
  bug: Bug,
  task: ListTodo,
  feature: Sparkles,
  backlog: Archive,
}

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
            <span className="px-2 py-1.5 text-xs text-sidebar-foreground/60">
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
  const { listsByProject, listsLoading } = useWorkspaceData()
  const lists = listsByProject[project.id]
  const isProjectRoute = pathname.startsWith(`/projects/${project.id}`)

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
      <CollapsibleContent>
        <SidebarMenuSub>
          {!lists && listsLoading && (
            <SidebarMenuSubItem>
              <SidebarMenuSkeleton />
            </SidebarMenuSubItem>
          )}
          {lists?.length === 0 && (
            <SidebarMenuSubItem>
              <span className="px-2 py-1 text-xs text-sidebar-foreground/60">
                No lists yet
              </span>
            </SidebarMenuSubItem>
          )}
          {lists?.map((list) => {
            const Icon = listIcons[list.type]
            const href = `/projects/${project.id}/lists/${list.id}`
            const isActive = pathname === href

            return (
              <SidebarMenuSubItem key={list.id}>
                <SidebarMenuSubButton isActive={isActive} render={<Link href={href} />}>
                  <Icon />
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
