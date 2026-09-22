"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { SiteHeader } from "@/components/layout/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Spinner } from "@/components/ui/spinner"
import { WorkspaceProvider } from "@/contexts/workspace-context"
import { useAuth } from "@/hooks/use-auth"
import type { User } from "@/lib/types"

export function ProtectedShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login")
    }
  }, [loading, user, router])

  if (loading || !user) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    )
  }

  const displayUser: User = {
    id: user.id,
    email: user.email ?? "",
    name: (user.user_metadata?.name as string | undefined) ?? undefined,
    avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? undefined,
    created_at: user.created_at,
    updated_at: user.updated_at ?? user.created_at,
  }

  return (
    <WorkspaceProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader user={displayUser} />
          <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </WorkspaceProvider>
  )
}
