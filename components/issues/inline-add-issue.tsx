"use client"

import { useRef, useState, type KeyboardEvent } from "react"
import { Plus } from "lucide-react"

import { Input } from "@/components/ui/input"
import { api } from "@/lib/api"
import type { Issue } from "@/lib/types"

/** Low-emphasis "+ Add Task" row that swaps to an inline title input. */
export function InlineAddIssue({
  listId,
  statusId,
  onCreated,
}: {
  listId: string
  statusId: string
  onCreated: (issue: Issue) => void
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
      const issue = await api.post<Issue>(`/lists/${listId}/issues`, {
        title: trimmed,
        type: "task",
        priority: "medium",
        status_id: statusId,
      })
      onCreated(issue)
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
        className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      >
        <Plus className="size-3.5" />
        Add Task
      </button>
    )
  }

  return (
    <div className="px-2 py-1">
      <Input
        autoFocus
        placeholder="Task title..."
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
