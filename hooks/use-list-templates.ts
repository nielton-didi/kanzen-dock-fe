"use client"

import { useEffect, useState } from "react"

import { api } from "@/lib/api"
import type { ListTemplate } from "@/lib/types"

// Templates are BE code constants, so one fetch per page load is enough.
// A failed fetch is not cached, so reopening the dialog retries.
let cached: Promise<ListTemplate[]> | null = null

function loadTemplates() {
  cached ??= api.get<ListTemplate[]>("/list-templates").catch((err) => {
    cached = null
    throw err
  })
  return cached
}

/** Fetches GET /list-templates while `enabled` (e.g. the create-list dialog is open). */
export function useListTemplates(enabled: boolean) {
  const [templates, setTemplates] = useState<ListTemplate[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) return

    let cancelled = false
    Promise.resolve()
      .then(() => {
        if (cancelled) return undefined
        setError(null)
        return loadTemplates()
      })
      .then((data) => {
        if (!cancelled && data) setTemplates(data)
      })
      .catch((err) => {
        if (!cancelled) setError((err as Error).message)
      })

    return () => {
      cancelled = true
    }
  }, [enabled])

  return { templates, error, loading: enabled && !templates && !error }
}
