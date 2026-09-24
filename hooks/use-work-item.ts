"use client"

import { useCallback, useEffect, useState } from "react"

import { api } from "@/lib/api"
import type { WorkItem } from "@/lib/types"

/** Fetches a single work item's full detail (including `list`/`history`, which
 * the list endpoint doesn't return) by id. */
export function useWorkItem(workItemId: string | undefined) {
  const [workItem, setWorkItem] = useState<WorkItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (!workItemId) {
      let cancelled = false
      Promise.resolve().then(() => {
        if (!cancelled) setWorkItem(null)
      })
      return () => {
        cancelled = true
      }
    }

    let cancelled = false
    Promise.resolve()
      .then(() => {
        if (cancelled) return undefined
        setLoading(true)
        setError(null)
        return api.get<WorkItem>(`/work-items/${workItemId}`)
      })
      .then((data) => {
        if (!cancelled && data) setWorkItem(data)
      })
      .catch((err) => {
        if (!cancelled) setError((err as Error).message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [workItemId, version])

  const refetch = useCallback(() => setVersion((v) => v + 1), [])

  return { workItem, setWorkItem, loading, error, refetch }
}
