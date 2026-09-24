"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { FolderKanban, ListTodo, Plus } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { ProjectListSwitcher } from "@/components/layout/project-list-switcher"
import { CreateListDialog } from "@/components/lists/create-list-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import { useWorkspaceData } from "@/contexts/workspace-context"

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const router = useRouter()
  const { workspaces, listsByProject, loading, listsLoading } = useWorkspaceData()

  const project = workspaces.flatMap((w) => w.projects).find((p) => p.id === projectId)
  const workspace = project
    ? workspaces.find((w) => w.id === project.workspace_id)
    : undefined
  const lists = listsByProject[projectId]

  // A project with lists redirects to its first one - this page only ever
  // renders as the "pick or create a list" landing spot.
  useEffect(() => {
    if (lists && lists.length > 0) {
      router.replace(`/projects/${projectId}/lists/${lists[0].id}`)
    }
  }, [lists, projectId, router])

  if (loading || (listsLoading && !lists) || (lists && lists.length > 0)) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    )
  }

  if (!project || !workspace) {
    return (
      <div className="flex w-full flex-1 flex-col gap-4">
        <PageHeader title="Project not found" />
        <Card className="flex-1">
          <CardContent className="flex flex-1 items-center justify-center py-10">
            <Empty className="border-0">
              <EmptyMedia variant="icon">
                <FolderKanban />
              </EmptyMedia>
              <EmptyTitle>Couldn&apos;t find this project</EmptyTitle>
              <EmptyDescription>
                It may belong to a different workspace - try switching
                workspaces from the sidebar.
              </EmptyDescription>
            </Empty>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-1 flex-col gap-4">
      <PageHeader
        title={
          <ProjectListSwitcher
            projects={workspace.projects}
            activeProjectId={projectId}
            lists={[]}
            activeListId={null}
            listsByProject={listsByProject}
          />
        }
      />
      <Card className="flex-1">
        <CardContent className="flex flex-1 items-center justify-center py-10">
          <Empty className="border-0">
            <EmptyMedia variant="icon">
              <ListTodo />
            </EmptyMedia>
            <EmptyTitle>No lists yet</EmptyTitle>
            <EmptyDescription>
              {`Create a list to start tracking work in "${project.name}".`}
            </EmptyDescription>
            <EmptyContent>
              <CreateListDialog projectId={projectId}>
                <Button variant="primary">
                  <Plus />
                  Create list
                </Button>
              </CreateListDialog>
            </EmptyContent>
          </Empty>
        </CardContent>
      </Card>
    </div>
  )
}
