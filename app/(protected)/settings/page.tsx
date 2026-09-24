"use client"

import { useState } from "react"
import { CircleAlert } from "lucide-react"

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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useWorkspaceData } from "@/contexts/workspace-context"
import { useAuth } from "@/hooks/use-auth"
import { getWorkspaceRole } from "@/lib/types"

export default function SettingsPage() {
  const { user } = useAuth()
  const { activeWorkspace, loading, deleteWorkspace } = useWorkspaceData()
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const name = (user?.user_metadata?.name as string | undefined) ?? ""
  const email = user?.email ?? ""
  const role = activeWorkspace ? getWorkspaceRole(activeWorkspace, user?.id) : null

  async function handleDeleteWorkspace() {
    if (!activeWorkspace) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteWorkspace(activeWorkspace.id)
    } catch (err) {
      setDeleteError((err as Error).message)
      setDeleting(false)
    }
  }

  return (
    <div className="flex w-full flex-1 flex-col gap-4">
      <PageHeader
        title="Settings"
        description="Manage your profile and workspace preferences."
      />

      <Tabs defaultValue="profile" className="max-w-2xl">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                This information will be visible to your workspace members.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field orientation="responsive">
                  <FieldLabel htmlFor="avatar">Avatar</FieldLabel>
                  <FieldContent>
                    <Avatar size="lg">
                      <AvatarFallback>
                        {(name || email).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </FieldContent>
                </Field>
                <Field>
                  <FieldLabel htmlFor="name">Full name</FieldLabel>
                  <Input id="name" defaultValue={name} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input id="email" defaultValue={email} disabled />
                  <FieldDescription>
                    Your email is managed by your account provider.
                  </FieldDescription>
                </Field>
                <Field orientation="horizontal">
                  <Button variant="primary" disabled>Save changes</Button>
                  <FieldDescription>
                    Profile editing (PATCH /api/users/me) is coming in a
                    future chunk.
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workspace" className="pt-4">
          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="flex justify-center py-6">
                  <Spinner className="size-5 text-muted-foreground" />
                </div>
              ) : !activeWorkspace ? (
                <p className="text-sm text-muted-foreground">
                  Create a workspace first to see its settings here.
                </p>
              ) : (
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="workspace-name">Workspace name</FieldLabel>
                    <Input
                      id="workspace-name"
                      defaultValue={activeWorkspace.name}
                      disabled
                    />
                  </Field>
                  <FieldDescription>
                    Renaming a workspace and managing members isn&apos;t in
                    the API contract yet - coming in a future chunk.
                  </FieldDescription>
                </FieldGroup>
              )}
            </CardContent>
          </Card>

          {activeWorkspace && role === "owner" && (
            <Card className="mt-4 border-destructive/50">
              <CardHeader>
                <CardTitle>Danger zone</CardTitle>
                <CardDescription>
                  Deleting a workspace also deletes all of its projects,
                  lists, workItems, and attachments. This can&apos;t be undone.
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
                      <Button
                        variant="danger-outline"
                        className="w-fit"
                        disabled={deleting}
                      >
                        Delete workspace
                      </Button>
                    }
                  />
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete workspace?</AlertDialogTitle>
                      <AlertDialogDescription>
                        &quot;{activeWorkspace.name}&quot; and everything in
                        it will be permanently deleted. This can&apos;t be
                        undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        variant="danger"
                        onClick={handleDeleteWorkspace}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
