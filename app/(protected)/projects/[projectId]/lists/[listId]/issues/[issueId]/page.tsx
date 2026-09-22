"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

import { Spinner } from "@/components/ui/spinner"

/** Task detail now opens as a modal over the list rather than its own page
 * (see components/issues/issue-detail-dialog.tsx) - this route only exists
 * so old bookmarks/links to a specific issue still land somewhere useful. */
export default function IssueDetailRedirect() {
  const { projectId, listId, issueId } = useParams<{
    projectId: string
    listId: string
    issueId: string
  }>()
  const router = useRouter()

  useEffect(() => {
    router.replace(`/projects/${projectId}/lists/${listId}?issue=${issueId}`)
  }, [router, projectId, listId, issueId])

  return (
    <div className="flex flex-1 items-center justify-center">
      <Spinner className="size-6 text-muted-foreground" />
    </div>
  )
}
