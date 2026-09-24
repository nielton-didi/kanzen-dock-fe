"use client"

import { useEffect, useState, type FormEvent } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, CircleAlert, ListTodo } from "lucide-react"

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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { StatusEditor } from "@/components/statuses/status-editor"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useWorkspaceData } from "@/contexts/workspace-context"
import { useListStatuses } from "@/hooks/use-list-statuses"

export default function ListSettingsPage() {
  const { projectId, listId } = useParams<{ projectId: string; listId: string }>()
  const router = useRouter()
  const { workspaces, listsByProject, loading, listsLoading, updateList, deleteList } =
    useWorkspaceData()

  const project = workspaces.flatMap((w) => w.projects).find((p) => p.id === projectId)
  const list = listsByProject[projectId]?.find((l) => l.id === listId)
  const workspace = project
    ? workspaces.find((w) => w.id === project.workspace_id)
    : undefined

  const { statuses, setStatuses } = useListStatuses(list?.id)

  const [name, setName] = useState(list?.name ?? "")
  const [targetProjectId, setTargetProjectId] = useState(projectId)
  const [savingGeneral, setSavingGeneral] = useState(false)
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    Promise.resolve().then(() => {
      if (list) setName(list.name)
      setTargetProjectId(projectId)
    })
  }, [list, projectId])

  async function handleSaveGeneral(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!list) return
    setSavingGeneral(true)
    setGeneralError(null)
    try {
      const data: { name?: string; project_id?: string } = {}
      if (name.trim() && name.trim() !== list.name) data.name = name.trim()
      if (targetProjectId !== list.project_id) data.project_id = targetProjectId

      if (Object.keys(data).length === 0) return

      const updated = await updateList(list.id, list.project_id, data)
      if (updated.project_id !== projectId) {
        router.push(`/projects/${updated.project_id}/lists/${updated.id}/settings`)
      }
    } catch (err) {
      setGeneralError((err as Error).message)
    } finally {
      setSavingGeneral(false)
    }
  }

  async function handleDelete() {
    if (!list) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteList(list.project_id, list.id)
      router.push("/dashboard")
    } catch (err) {
      setDeleteError((err as Error).message)
      setDeleting(false)
    }
  }

  if (loading || (listsLoading && !list)) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    )
  }

  if (!project || !list || !workspace) {
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

  const otherProjects = workspace.projects.filter((p) => p.id !== list.project_id)

  return (
    <div className="flex w-full flex-1 flex-col gap-4">
      <Link
        href={`/projects/${projectId}/lists/${listId}`}
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to {list.name}
      </Link>

      <PageHeader
        title={`${list.name} settings`}
        description={`in ${project.name}`}
      />

      <Tabs defaultValue="general" className="max-w-3xl">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="statuses">Statuses</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="flex flex-col gap-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>General</CardTitle>
              <CardDescription>
                Rename this list or move it to another project in the same
                workspace.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveGeneral}>
                <FieldGroup>
                  {generalError && (
                    <Alert variant="destructive">
                      <CircleAlert />
                      <AlertDescription>{generalError}</AlertDescription>
                    </Alert>
                  )}
                  <Field>
                    <FieldLabel htmlFor="list-name">Name</FieldLabel>
                    <Input
                      id="list-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </Field>
                  {otherProjects.length > 0 && (
                    <Field>
                      <FieldLabel htmlFor="list-project">Project</FieldLabel>
                      <Select
                        value={targetProjectId}
                        onValueChange={(v) => setTargetProjectId(v ?? list.project_id)}
                      >
                        <SelectTrigger id="list-project" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={list.project_id}>{project.name}</SelectItem>
                          {otherProjects.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                  <Field orientation="horizontal">
                    <Button type="submit" disabled={savingGeneral}>
                      {savingGeneral && <Spinner />}
                      Save changes
                    </Button>
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle>Danger zone</CardTitle>
              <CardDescription>
                Deleting a list also deletes all of its work items, statuses, and
                attachments. This can&apos;t be undone.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {deleteError && (
                <Alert variant="destructive">
                  <CircleAlert />
                  <AlertDescription>{deleteError}</AlertDescription>
                </Alert>
              )}
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button variant="destructive" className="w-fit" disabled={deleting}>
                      Delete list
                    </Button>
                  }
                />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete list?</AlertDialogTitle>
                    <AlertDialogDescription>
                      &quot;{list.name}&quot; and everything in it will be
                      permanently deleted. This can&apos;t be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction variant="destructive" onClick={handleDelete}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statuses" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Statuses</CardTitle>
              <CardDescription>
                Drag statuses to reorder them or move them between categories.
                Categories are fixed, but statuses within them are yours to
                customize.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StatusEditor listId={list.id} statuses={statuses} setStatuses={setStatuses} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
