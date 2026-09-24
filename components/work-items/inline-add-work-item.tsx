"use client"

import { useRef, useState, type KeyboardEvent } from "react"
import { Plus } from "lucide-react"
import { cn } from "cn"

import { WORK_ITEM_ROW_COLUMNS } from "@/components/work-items/work-item-row"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/api"
import type { WorkItem } from "@/lib/types"

/** Low-emphasis "+ Add work item" row that swaps to an inline title input. */
export function InlineAddWorkItem({
  listId,
  statusId,
  onCreated,
}: {
  listId: string
  statusId: string
  onCreated: (workItem: WorkItem) => void
}) {
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Removing a focused input from the DOM (via close()) can itself fire a
  // native blur, which would otherwise re-trigger handleBlur right after.
  const skipNextBlurRef = useRef(false)

  function close() {
    skipNextBlurRef.current = true
    setAdding(false)
    setTitle("")
    setError(null)
  }

  async function submit() {
    const trimmed = title.trim()
    if (!trimmed) {
      close()
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const workItem = await api.post<WorkItem>(`/lists/${listId}/work-items`, {
        title: trimmed,
        type: "task",
        priority: "medium",
        status_id: statusId,
      })
      onCreated(workItem)
      close()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault()
      submit()
    } else if (event.key === "Escape") {
      event.preventDefault()
      close()
    }
  }

  function handleBlur() {
    if (skipNextBlurRef.current) {
      skipNextBlurRef.current = false
      return
    }
    if (submitting) return
    if (!title.trim()) {
      close()
      return
    }
    submit()
  }

  if (!adding) {
    return (
      <button
        type="button"
        onClick={() => setAdding(true)}
        className={cn(
          WORK_ITEM_ROW_COLUMNS,
          "w-full rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        )}
      >
        <div className="flex size-5 shrink-0 items-center justify-center">
          <Plus className="size-3.5" />
        </div>
        <span>Add work item</span>
      </button>
    )
  }

  return (
    <div className="px-2 py-1">
      <Input
        autoFocus
        placeholder="Work item title..."
        value={title}
        disabled={submitting}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className="h-8"
      />
      {error && <p className="mt-1 px-0.5 text-xs text-destructive">{error}</p>}
    </div>
  )
}
