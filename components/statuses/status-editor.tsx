"use client"

import { useEffect, useState } from "react"
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "cn"
import { CircleAlert, GripVertical, MoreHorizontal, Trash2 } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { CreateStatusDialog } from "@/components/statuses/create-status-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { STATUS_CATEGORIES } from "@/components/issues/issue-badges"
import { StatusColorPicker } from "@/components/statuses/status-color-picker"
import { ApiError, api } from "@/lib/api"
import type { Status, StatusCategory, StatusColor } from "@/lib/types"

type Grouped = Record<StatusCategory, Status[]>

function groupByCategory(statuses: Status[]): Grouped {
  const grouped: Grouped = { not_started: [], active: [], done: [], closed: [] }
  for (const status of [...statuses].sort((a, b) => a.position - b.position)) {
    grouped[status.category].push(status)
  }
  return grouped
}

function findContainer(grouped: Grouped, id: string): StatusCategory | undefined {
  return STATUS_CATEGORIES.find(({ value }) => grouped[value].some((s) => s.id === id))?.value
}

export function StatusEditor({
  listId,
  statuses,
  setStatuses,
}: {
  listId: string
  statuses: Status[]
  setStatuses: React.Dispatch<React.SetStateAction<Status[]>>
}) {
  const [grouped, setGrouped] = useState<Grouped>(() => groupByCategory(statuses))
  const [reorderError, setReorderError] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<{
    status: Status
    issuesCount: number
  } | null>(null)
  const [reassignTo, setReassignTo] = useState<string>("")
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    Promise.resolve().then(() => setGrouped(groupByCategory(statuses)))
  }, [statuses])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  async function persistOrder(next: Grouped) {
    setReorderError(null)
    try {
      const updated = await api.patch<Status[]>(
        `/lists/${listId}/statuses/reorder`,
        {
          not_started: next.not_started.map((s) => s.id),
          active: next.active.map((s) => s.id),
          done: next.done.map((s) => s.id),
          closed: next.closed.map((s) => s.id),
        }
      )
      setStatuses(updated)
    } catch (err) {
      setReorderError((err as Error).message)
      setGrouped(groupByCategory(statuses)) // revert to last known-good order
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeContainer = findContainer(grouped, String(active.id))
    const overContainer =
      STATUS_CATEGORIES.find((c) => c.value === over.id)?.value ??
      findContainer(grouped, String(over.id))

    if (!activeContainer || !overContainer || activeContainer === overContainer) return

    setGrouped((prev) => {
      const activeItems = prev[activeContainer]
      const overItems = prev[overContainer]
      const activeIndex = activeItems.findIndex((s) => s.id === active.id)
      if (activeIndex === -1) return prev

      const overIndex = overItems.findIndex((s) => s.id === over.id)
      const insertAt = overIndex >= 0 ? overIndex : overItems.length

      const moved = { ...activeItems[activeIndex], category: overContainer }
      const nextActive = activeItems.filter((s) => s.id !== active.id)
      const nextOver = [
        ...overItems.slice(0, insertAt),
        moved,
        ...overItems.slice(insertAt),
      ]

      return { ...prev, [activeContainer]: nextActive, [overContainer]: nextOver }
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return

    const container = findContainer(grouped, String(active.id))
    if (!container) return

    const items = grouped[container]
    const oldIndex = items.findIndex((s) => s.id === active.id)
    const newIndex = items.findIndex((s) => s.id === over.id)

    const next =
      newIndex >= 0 && newIndex !== oldIndex
        ? { ...grouped, [container]: arrayMove(items, oldIndex, newIndex) }
        : grouped

    setGrouped(next)
    persistOrder(next)
  }

  async function handleRename(statusId: string, name: string) {
    const updated = await api.put<Status>(`/statuses/${statusId}`, { name })
    setStatuses((prev) => prev.map((s) => (s.id === statusId ? updated : s)))
  }

  async function handleRecolor(statusId: string, color: StatusColor) {
    const updated = await api.put<Status>(`/statuses/${statusId}`, { color })
    setStatuses((prev) => prev.map((s) => (s.id === statusId ? updated : s)))
  }

  async function attemptDelete(status: Status, reassignToStatusId?: string) {
    setDeleting(true)
    setDeleteError(null)
    try {
      await api.delete(
        `/statuses/${status.id}`,
        reassignToStatusId ? { reassign_to_status_id: reassignToStatusId } : undefined
      )
      setStatuses((prev) => prev.filter((s) => s.id !== status.id))
      setPendingDelete(null)
      setReassignTo("")
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const body = err.body as { issuesCount?: number } | null
        setPendingDelete({ status, issuesCount: body?.issuesCount ?? 0 })
      } else {
        setDeleteError((err as Error).message)
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {reorderError && (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertDescription>{reorderError}</AlertDescription>
        </Alert>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {STATUS_CATEGORIES.map(({ value, label }) => (
            <CategoryColumn
              key={value}
              category={value}
              label={label}
              statuses={grouped[value]}
              onRename={handleRename}
              onRecolor={handleRecolor}
              onDelete={(status) => attemptDelete(status)}
            />
          ))}
        </div>
      </DndContext>

      <CreateStatusDialog
        listId={listId}
        onCreated={(status) => setStatuses((prev) => [...prev, status])}
      >
        <Button variant="outline" size="sm" className="w-fit">
          Add status
        </Button>
      </CreateStatusDialog>

      {statuses.length <= 1 && (
        <p className="text-xs text-muted-foreground">
          A list must always have at least one status.
        </p>
      )}

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(next) => {
          if (!next) {
            setPendingDelete(null)
            setReassignTo("")
            setDeleteError(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete &quot;{pendingDelete?.status.name}&quot;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete?.issuesCount} issue(s) currently use this status.
              Choose another status to move them to before deleting.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deleteError && (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          )}

          <Select value={reassignTo} onValueChange={(v) => setReassignTo(v ?? "")}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Move issues to..." />
            </SelectTrigger>
            <SelectContent>
              {statuses
                .filter((s) => s.id !== pendingDelete?.status.id)
                .map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={!reassignTo || deleting}
              onClick={() =>
                pendingDelete && attemptDelete(pendingDelete.status, reassignTo)
              }
            >
              Move issues & delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function CategoryColumn({
  category,
  label,
  statuses,
  onRename,
  onRecolor,
  onDelete,
}: {
  category: StatusCategory
  label: string
  statuses: Status[]
  onRename: (id: string, name: string) => Promise<void>
  onRecolor: (id: string, color: StatusColor) => Promise<void>
  onDelete: (status: Status) => void
}) {
  const { setNodeRef } = useDroppable({ id: category })

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <SortableContext
        items={statuses.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <div ref={setNodeRef} className="flex min-h-10 flex-col gap-1.5">
          {statuses.map((status) => (
            <SortableStatusRow
              key={status.id}
              status={status}
              onRename={onRename}
              onRecolor={onRecolor}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}

function SortableStatusRow({
  status,
  onRename,
  onRecolor,
  onDelete,
}: {
  status: Status
  onRename: (id: string, name: string) => Promise<void>
  onRecolor: (id: string, color: StatusColor) => Promise<void>
  onDelete: (status: Status) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: status.id })
  const [name, setName] = useState(status.name)

  useEffect(() => {
    Promise.resolve().then(() => setName(status.name))
  }, [status.name])

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-1.5 rounded-md border bg-card px-2 py-1.5",
        isDragging && "opacity-50"
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
        <span className="sr-only">Drag to reorder</span>
      </button>
      <StatusColorPicker
        value={status.color}
        onChange={(color) => onRecolor(status.id, color)}
      />
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => {
          const trimmed = name.trim()
          if (trimmed && trimmed !== status.name) onRename(status.id, trimmed)
          else setName(status.name)
        }}
        className="h-7 flex-1 border-transparent bg-transparent px-1.5 shadow-none hover:border-input focus-visible:border-input"
      />
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-sm">
              <MoreHorizontal />
            </Button>
          }
        />
        <DropdownMenuContent align="end">
          <DropdownMenuItem variant="destructive" onClick={() => onDelete(status)}>
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
