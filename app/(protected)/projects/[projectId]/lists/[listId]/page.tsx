"use client"

import { useParams } from "next/navigation"
import { ListTodo } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import { useWorkspaceData } from "@/contexts/workspace-context"

export default function ListPage() {
  const { projectId, listId } = useParams<{ projectId: string; listId: string }>()
  const { workspaces, listsByProject, loading, listsLoading } = useWorkspaceData()

  const project = workspaces.flatMap((w) => w.projects).find((p) => p.id === projectId)
  const list = listsByProject[projectId]?.find((l) => l.id === listId)

  if (loading || (listsLoading && !list)) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    )
  }

  if (!project || !list) {
    return (
      <div className="flex w-full flex-1 flex-col gap-4">
        <PageHeader title="List not found" />
        <Card className="flex-1">
          <CardContent className="flex flex-1 items-center justify-center py-16">
            <Empty className="border-0">
              <EmptyMedia variant="icon">
                <ListTodo />
              </EmptyMedia>
              <EmptyTitle>Couldn&apos;t find this list</EmptyTitle>
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
        title={list.name}
        badge={
          <Badge variant="secondary" className="capitalize">
            {list.type}
          </Badge>
        }
        description={`in ${project.name}`}
      />

      <Card className="flex-1">
        <CardContent className="flex flex-1 items-center justify-center py-16">
          <Empty className="border-0">
            <EmptyMedia variant="icon">
              <ListTodo />
            </EmptyMedia>
            <EmptyTitle>Issue tracking is coming next</EmptyTitle>
            <EmptyDescription>
              This is where issues for &quot;{list.name}&quot; will live once
              the issue tracking chunk is implemented.
            </EmptyDescription>
          </Empty>
        </CardContent>
      </Card>
    </div>
  )
}
