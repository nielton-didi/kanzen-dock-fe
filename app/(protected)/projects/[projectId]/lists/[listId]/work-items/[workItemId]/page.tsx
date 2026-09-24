"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

import { Spinner } from "@/components/ui/spinner"

/** Work item detail now opens as a modal over the list rather than its own page
 * (see components/work-items/work-item-detail-dialog.tsx) - this route only exists
 * so old bookmarks/links to a specific work item still land somewhere useful. */
export default function WorkItemDetailRedirect() {
  const { projectId, listId, workItemId } = useParams<{
    projectId: string
    listId: string
    workItemId: string
  }>()
  const router = useRouter()

  useEffect(() => {
    router.replace(`/projects/${projectId}/lists/${listId}?item=${workItemId}`)
  }, [router, projectId, listId, workItemId])

  return (
    <div className="flex flex-1 items-center justify-center">
      <Spinner className="size-6 text-muted-foreground" />
    </div>
  )
}
