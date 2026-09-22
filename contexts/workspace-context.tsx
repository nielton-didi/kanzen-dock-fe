"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

import { api } from "@/lib/api"
import type { List, Project, Workspace } from "@/lib/types"

interface WorkspaceContextValue {
  workspaces: Workspace[]
  loading: boolean
  error: string | null
  activeWorkspaceId: string | null
  activeWorkspace: Workspace | null
  setActiveWorkspaceId: (id: string) => void
  listsByProject: Record<string, List[]>
  listsLoading: boolean
  refetch: () => Promise<void>
  createWorkspace: (name: string) => Promise<Workspace>
  createProject: (workspaceId: string, name: string) => Promise<Project>
  createList: (projectId: string, name: string) => Promise<List>
  deleteProject: (workspaceId: string, projectId: string) => Promise<void>
  deleteWorkspace: (workspaceId: string) => Promise<void>
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null)
  const [listsByProject, setListsByProject] = useState<Record<string, List[]>>({})
  const [listsLoading, setListsLoading] = useState(false)

  const applyWorkspaces = useCallback((data: Workspace[]) => {
    setWorkspaces(data)
    setActiveWorkspaceId((current) =>
      current && data.some((w) => w.id === current) ? current : (data[0]?.id ?? null)
    )
  }, [])

  // Initial load on mount. This chains directly off the fetch promise
  // (rather than calling a separately-defined async function) so no
  // setState happens synchronously in the effect body itself - `loading`
  // is already `true` from its initial state above.
  useEffect(() => {
    let cancelled = false
    api
      .get<Workspace[]>("/workspaces")
      .then((data) => {
        if (!cancelled) applyWorkspaces(data)
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
  }, [applyWorkspaces])

  // Manual refetch, exposed to consumers - called from event handlers, not
  // from an effect, so re-showing the loading state here is safe.
  const fetchWorkspaces = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      applyWorkspaces(await api.get<Workspace[]>("/workspaces"))
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [applyWorkspaces])

  const activeWorkspace = useMemo(
    () => workspaces.find((w) => w.id === activeWorkspaceId) ?? null,
    [workspaces, activeWorkspaceId]
  )

  // Eagerly fetch lists for every project in the active workspace. Lists
  // aren't nested in the workspace/project responses (see lib/types.ts),
  // and this app is small enough that N parallel requests per workspace
  // switch is simpler than a fetch-on-expand pattern in the sidebar.
  useEffect(() => {
    if (!activeWorkspace || activeWorkspace.projects.length === 0) return

    let cancelled = false

    Promise.resolve()
      .then(() => {
        if (cancelled) return undefined
        setListsLoading(true)
        return Promise.all(
          activeWorkspace.projects.map(async (project) => {
            const lists = await api.get<List[]>(`/projects/${project.id}/lists`)
            return [project.id, lists] as const
          })
        )
      })
      .then((entries) => {
        if (!entries || cancelled) return
        setListsByProject((prev) => ({ ...prev, ...Object.fromEntries(entries) }))
      })
      .catch((err) => {
        if (!cancelled) setError((err as Error).message)
      })
      .finally(() => {
        if (!cancelled) setListsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [activeWorkspace])

  const createWorkspace = useCallback(async (name: string) => {
    const created = await api.post<Workspace>("/workspaces", { name })
    // POST /workspaces doesn't include `projects` (unlike GET), so a fresh
    // workspace genuinely has none yet - fill it in rather than leave it
    // undefined and crash every `.projects` consumer.
    const workspace: Workspace = { ...created, projects: created.projects ?? [] }
    setWorkspaces((prev) => [...prev, workspace])
    setActiveWorkspaceId(workspace.id)
    return workspace
  }, [])

  const createProject = useCallback(async (workspaceId: string, name: string) => {
    const project = await api.post<Project>(`/workspaces/${workspaceId}/projects`, {
      name,
    })
    setWorkspaces((prev) =>
      prev.map((w) =>
        w.id === workspaceId ? { ...w, projects: [project, ...w.projects] } : w
      )
    )
    setListsByProject((prev) => ({ ...prev, [project.id]: [] }))
    return project
  }, [])

  const createList = useCallback(async (projectId: string, name: string) => {
    const list = await api.post<List>(`/projects/${projectId}/lists`, {
      name,
    })
    setListsByProject((prev) => ({
      ...prev,
      [projectId]: [...(prev[projectId] ?? []), list],
    }))
    return list
  }, [])

  const deleteProject = useCallback(async (workspaceId: string, projectId: string) => {
    await api.delete(`/workspaces/${workspaceId}/projects/${projectId}`)
    setWorkspaces((prev) =>
      prev.map((w) =>
        w.id === workspaceId
          ? { ...w, projects: w.projects.filter((p) => p.id !== projectId) }
          : w
      )
    )
    setListsByProject((prev) => {
      const next = { ...prev }
      delete next[projectId]
      return next
    })
  }, [])

  const deleteWorkspace = useCallback(
    async (workspaceId: string) => {
      await api.delete(`/workspaces/${workspaceId}`)
      setWorkspaces((prev) => {
        const next = prev.filter((w) => w.id !== workspaceId)
        setActiveWorkspaceId((current) =>
          current === workspaceId ? (next[0]?.id ?? null) : current
        )
        return next
      })
    },
    []
  )

  const value: WorkspaceContextValue = {
    workspaces,
    loading,
    error,
    activeWorkspaceId,
    activeWorkspace,
    setActiveWorkspaceId,
    listsByProject,
    listsLoading,
    refetch: fetchWorkspaces,
    createWorkspace,
    createProject,
    createList,
    deleteProject,
    deleteWorkspace,
  }

  return (
    <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
  )
}

export function useWorkspaceData() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) {
    throw new Error("useWorkspaceData must be used within a WorkspaceProvider")
  }
  return ctx
}
