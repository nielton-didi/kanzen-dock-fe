"use client"

import { useRouter } from "next/navigation"
import { cn } from "cn"
import { ChevronDownIcon, ChevronRightIcon, FolderKanban, ListTodo } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { List, Project } from "@/lib/types"

const triggerClass =
  "flex min-w-0 items-center gap-1.5 rounded-md px-1.5 py-1 text-sm font-medium outline-none select-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"

export function ProjectListSwitcher({
  projects,
  activeProjectId,
  lists,
  activeListId,
  listsByProject,
}: {
  projects: Project[]
  activeProjectId: string
  lists: List[]
  activeListId: string | null
  listsByProject: Record<string, List[]>
}) {
  const router = useRouter()

  const activeProject = projects.find((p) => p.id === activeProjectId)
  const activeList = lists.find((l) => l.id === activeListId)

  function handleProjectChange(nextProjectId: string) {
    if (nextProjectId === activeProjectId) return
    const nextLists = listsByProject[nextProjectId]
    if (nextLists && nextLists.length > 0) {
      router.push(`/projects/${nextProjectId}/lists/${nextLists[0].id}`)
    } else {
      router.push(`/projects/${nextProjectId}`)
    }
  }

  function handleListChange(nextListId: string) {
    if (nextListId === activeListId) return
    router.push(`/projects/${activeProjectId}/lists/${nextListId}`)
  }

  return (
    <div className="flex min-w-0 items-center gap-1">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className={cn(triggerClass, "text-muted-foreground hover:text-foreground")}
            />
          }
        >
          <FolderKanban className="size-3.5 shrink-0" />
          <span className="max-w-40 truncate">{activeProject?.name}</span>
          {projects.length > 1 && (
            <ChevronDownIcon className="size-3.5 shrink-0 text-subtle-foreground" />
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuRadioGroup value={activeProjectId} onValueChange={handleProjectChange}>
            {projects.map((project) => (
              <DropdownMenuRadioItem
                key={project.id}
                value={project.id}
                closeOnClick
              >
                <span className="truncate">{project.name}</span>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <ChevronRightIcon className="size-3.5 shrink-0 text-subtle-foreground" />

      {activeListId && lists.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<button type="button" className={cn(triggerClass, "text-foreground")} />}
          >
            <ListTodo className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="max-w-40 truncate">{activeList?.name}</span>
            {lists.length > 1 && (
              <ChevronDownIcon className="size-3.5 shrink-0 text-subtle-foreground" />
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuRadioGroup value={activeListId} onValueChange={handleListChange}>
              {lists.map((list) => (
                <DropdownMenuRadioItem key={list.id} value={list.id} closeOnClick>
                  <span className="truncate">{list.name}</span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <span className="flex items-center gap-1.5 px-1.5 py-1 text-sm font-medium text-muted-foreground">
          <ListTodo className="size-3.5 shrink-0" />
          No lists
        </span>
      )}
    </div>
  )
}
