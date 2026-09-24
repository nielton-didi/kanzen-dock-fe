"use client"

import { useCallback, useEffect, useState } from "react"

import { api } from "@/lib/api"
import type { ListPreference } from "@/lib/types"

/**
 * The current user's own view settings for a list (D6), saved on the server
 * so they follow the user across devices. Updates apply optimistically and
 * roll back if the save fails.
 */
export function useListPreferences(listId: string | undefined) {
  const [rowFieldIds, setRowFieldIds] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!listId) return

    let cancelled = false
    Promise.resolve()
      .then(() => {
        if (cancelled) return undefined
        setError(null)
        return api.get<ListPreference>(`/lists/${listId}/preferences/me`)
      })
      .then((data) => {
        if (!cancelled && data) setRowFieldIds(data.row_field_ids)
      })
      .catch((err) => {
        if (!cancelled) setError((err as Error).message)
      })

    return () => {
      cancelled = true
    }
  }, [listId])

  const updateRowFieldIds = useCallback(
    async (next: string[]) => {
      if (!listId) return
      const previous = rowFieldIds
      setRowFieldIds(next)
      setError(null)
      try {
        const saved = await api.put<ListPreference>(`/lists/${listId}/preferences/me`, {
          row_field_ids: next,
        })
        setRowFieldIds(saved.row_field_ids)
      } catch (err) {
        setRowFieldIds(previous)
        setError((err as Error).message)
      }
    },
    [listId, rowFieldIds]
  )

  return { rowFieldIds, updateRowFieldIds, error }
}
