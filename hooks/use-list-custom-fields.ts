"use client"

import { useCallback, useEffect, useState } from "react"

import { api } from "@/lib/api"
import type { FieldDefinition } from "@/lib/types"

/** Fetches a list's custom field definitions (ordered by position). */
export function useListCustomFields(listId: string | undefined) {
  const [fields, setFields] = useState<FieldDefinition[]>([])
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
        return api.get<FieldDefinition[]>(`/lists/${listId}/custom-fields`)
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
  }, [listId, version])

  const refetch = useCallback(() => setVersion((v) => v + 1), [])

  return { fields, setFields, loading, error, refetch }
}
