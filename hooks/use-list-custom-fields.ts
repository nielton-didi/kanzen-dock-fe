"use client"

import { useCallback, useEffect, useState } from "react"

import { api } from "@/lib/api"
import type { FieldDefinition } from "@/lib/types"

/**
 * Fetches a list's custom field definitions (ordered by position). With
 * `deleted`, fetches its soft-deleted fields instead (most recently deleted first).
 */
export function useListCustomFields(
  listId: string | undefined,
  { deleted = false }: { deleted?: boolean } = {}
) {
  const [fields, setFields] = useState<FieldDefinition[]>([])
  // Starts true when there's a list to fetch, so callers don't flash an empty state.
  const [loading, setLoading] = useState(Boolean(listId))
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
        return api.get<FieldDefinition[]>(
          `/lists/${listId}/custom-fields${deleted ? "?deleted=true" : ""}`
        )
      })
      .then((data) => {
        if (!cancelled && data) setFields(data)
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
  }, [listId, deleted, version])

  const refetch = useCallback(() => setVersion((v) => v + 1), [])

  return { fields, setFields, loading, error, refetch }
}
