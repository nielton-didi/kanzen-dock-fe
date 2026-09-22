"use client"

import { useCallback, useEffect, useState } from "react"

import { api } from "@/lib/api"
import type { Issue } from "@/lib/types"

/** Fetches a single issue's full detail (including `list`/`history`, which
 * the list endpoint doesn't return) by id. */
export function useIssue(issueId: string | undefined) {
  const [issue, setIssue] = useState<Issue | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (!issueId) {
      let cancelled = false
      Promise.resolve().then(() => {
        if (!cancelled) setIssue(null)
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
        return api.get<Issue>(`/issues/${issueId}`)
      })
      .then((data) => {
        if (!cancelled && data) setIssue(data)
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
  }, [issueId, version])

  const refetch = useCallback(() => setVersion((v) => v + 1), [])

  return { issue, setIssue, loading, error, refetch }
}
