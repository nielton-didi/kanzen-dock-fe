"use client"

import { usePathname } from "next/navigation"

import { NotificationsMenu } from "@/components/layout/notifications-menu"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { UserMenu } from "@/components/layout/user-menu"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { SidebarTrigger } from "@/components/ui/sidebar"
import type { User } from "@/lib/types"

const sectionLabels: Record<string, string> = {
  dashboard: "Dashboard",
  settings: "Settings",
  projects: "Projects",
}

function currentSectionLabel(pathname: string) {
  const [first] = pathname.split("/").filter(Boolean)
  return sectionLabels[first] ?? "Overview"
}

export function SiteHeader({ user }: { user: User }) {
  const pathname = usePathname()

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/95 backdrop-blur">
      <div className="flex flex-1 items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>{currentSectionLabel(pathname)}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex items-center gap-1 px-4">
        <ThemeToggle />
        <NotificationsMenu />
        <UserMenu user={user} />
      </div>
    </header>
  )
}
