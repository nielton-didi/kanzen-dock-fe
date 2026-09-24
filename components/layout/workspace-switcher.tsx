"use client"

import { useState } from "react"
import { Building2, Check, ChevronsUpDown, Plus } from "lucide-react"

import { CreateWorkspaceDialog } from "@/components/workspaces/create-workspace-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar"
import { useWorkspaceData } from "@/contexts/workspace-context"

export function WorkspaceSwitcher() {
  const { workspaces, activeWorkspace, setActiveWorkspaceId, loading } =
    useWorkspaceData()
  const [createOpen, setCreateOpen] = useState(false)

  if (loading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuSkeleton showIcon />
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  if (!activeWorkspace) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <CreateWorkspaceDialog>
            <SidebarMenuButton size="lg">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg border border-dashed border-sidebar-border text-muted-foreground">
                <Plus className="size-4" />
              </div>
              <span className="truncate font-medium">Create workspace</span>
            </SidebarMenuButton>
          </CreateWorkspaceDialog>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-popup-open:bg-sidebar-accent data-popup-open:text-sidebar-accent-foreground"
              />
            }
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Building2 className="size-4" />
            </div>
            <div className="grid flex-1 text-left leading-tight">
              <span className="truncate font-medium">{activeWorkspace.name}</span>
              <span className="truncate text-xs text-muted-foreground">
                Workspace
              </span>
            </div>
            <ChevronsUpDown className="ml-auto size-4 text-subtle-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--anchor-width) min-w-56"
            align="start"
            side="bottom"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
              {workspaces.map((workspace) => (
                <DropdownMenuItem
                  key={workspace.id}
                  onClick={() => setActiveWorkspaceId(workspace.id)}
                  className="gap-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-md border border-border">
                    <Building2 className="size-3.5" />
                  </div>
                  <span className="flex-1 truncate">{workspace.name}</span>
                  {workspace.id === activeWorkspace.id && (
                    <Check className="size-4 text-muted-foreground" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="gap-2 text-muted-foreground"
                onClick={() => setCreateOpen(true)}
              >
                <div className="flex size-6 items-center justify-center rounded-md border border-dashed border-border">
                  <Plus className="size-3.5" />
                </div>
                Create workspace
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
      <CreateWorkspaceDialog open={createOpen} onOpenChange={setCreateOpen} />
    </SidebarMenu>
  )
}
