"use client"

import { FolderKanban, LayoutList, Plus, Users } from "lucide-react"

import { PageHeader } from "@/components/layout/page-header"
import { CreateProjectDialog } from "@/components/projects/create-project-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import { CreateWorkspaceDialog } from "@/components/workspaces/create-workspace-dialog"
import { useWorkspaceData } from "@/contexts/workspace-context"
import { useAuth } from "@/hooks/use-auth"

export default function DashboardPage() {
  const { user } = useAuth()
  const { activeWorkspace, listsByProject, loading } = useWorkspaceData()

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    )
  }

  if (!activeWorkspace) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <PageHeader title="Dashboard" />
        <Card className="flex-1">
          <CardContent className="flex flex-1 items-center justify-center py-10">
            <Empty className="border-0">
              <EmptyMedia variant="icon">
                <FolderKanban />
              </EmptyMedia>
              <EmptyTitle>Create your first workspace</EmptyTitle>
              <EmptyDescription>
                Workspaces group your projects and team members.
              </EmptyDescription>
              <CreateWorkspaceDialog>
                <Button variant="primary" className="mt-2">
                  <Plus />
                  Create workspace
                </Button>
              </CreateWorkspaceDialog>
            </Empty>
          </CardContent>
        </Card>
      </div>
    )
  }

  const projectCount = activeWorkspace.projects.length
  const listCount = activeWorkspace.projects.reduce(
    (n, p) => n + (listsByProject[p.id]?.length ?? 0),
    0
  )
  const memberCount = activeWorkspace.members.length

  const stats = [
    { label: "Projects", value: projectCount, icon: FolderKanban },
    { label: "Lists", value: listCount, icon: LayoutList },
    { label: "Members", value: memberCount, icon: Users },
  ]

  const firstName = user?.user_metadata?.name?.split(" ")[0] ?? user?.email?.split("@")[0]

  return (
    <div className="flex w-full flex-1 flex-col gap-4">
      <PageHeader
        title={`Welcome back${firstName ? `, ${firstName}` : ""}`}
        description={`Here's what's happening in ${activeWorkspace.name}.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <Icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tabular-nums">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="flex-1">
        <CardContent className="flex flex-1 items-center justify-center py-10">
          {projectCount === 0 ? (
            <Empty className="border-0">
              <EmptyMedia variant="icon">
                <FolderKanban />
              </EmptyMedia>
              <EmptyTitle>Create your first project</EmptyTitle>
              <EmptyDescription>
                Projects hold lists like Bugs, Tasks, and Backlog.
              </EmptyDescription>
              <CreateProjectDialog workspaceId={activeWorkspace.id}>
                <Button variant="primary" className="mt-2">
                  <Plus />
                  Create project
                </Button>
              </CreateProjectDialog>
            </Empty>
          ) : (
            <Empty className="border-0">
              <EmptyMedia variant="icon">
                <LayoutList />
              </EmptyMedia>
              <EmptyTitle>Recent activity will show up here</EmptyTitle>
              <EmptyDescription>
                Work item tracking and activity feeds are coming in the next
                implementation chunk.
              </EmptyDescription>
            </Empty>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
