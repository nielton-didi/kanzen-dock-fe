"use client"

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

export default function SettingsPage() {
  const { user } = useAuth()
  const { activeWorkspace, loading } = useWorkspaceData()

  const name = (user?.user_metadata?.name as string | undefined) ?? ""
  const email = user?.email ?? ""

  return (
    <div className="flex w-full flex-1 flex-col gap-6">
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
                  <Button disabled>Save changes</Button>
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
