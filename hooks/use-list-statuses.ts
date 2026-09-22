"use client"

import { useCallback, useEffect, useState } from "react"

import { api } from "@/lib/api"
import type { Status } from "@/lib/types"

/** Fetches a list's custom statuses (ordered by category, then position). */
export function useListStatuses(listId: string | undefined) {
  const [statuses, setStatuses] = useState<Status[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (!listId) return

    let cancelled = false
    Promise.resolve()
      .then(() => {
        if (cancelled) return undefined
        setLoading(true)
        setError(null)
        return api.get<Status[]>(`/lists/${listId}/statuses`)
      })
      .then((data) => {
        if (!cancelled && data) setStatuses(data)
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
  }, [listId, version])

  const refetch = useCallback(() => setVersion((v) => v + 1), [])

  return { statuses, setStatuses, loading, error, refetch }
}
