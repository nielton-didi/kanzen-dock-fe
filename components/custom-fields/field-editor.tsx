"use client"

import { useEffect, useState } from "react"
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
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
import { format } from "date-fns"
import {
  ChevronDown,
  CircleAlert,
  GripVertical,
  MoreHorizontal,
  Plus,
  Trash2,
  X,
} from "lucide-react"

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { CreateFieldDialog } from "@/components/custom-fields/create-field-dialog"
import {
  FIELD_KIND_LABELS,
  FieldKindIcon,
  FieldOptionLabel,
} from "@/components/custom-fields/custom-field-display"
import { StatusColorPicker } from "@/components/statuses/status-color-picker"
import { STATUS_COLORS } from "@/components/work-items/work-item-badges"
import { useListCustomFields } from "@/hooks/use-list-custom-fields"
import { ApiError, api } from "@/lib/api"
import type { FieldDefinition, FieldKind, StatusColor } from "@/lib/types"

const OPTION_KINDS: readonly FieldKind[] = ["dropdown", "multi_select"]

function hasOptions(field: FieldDefinition) {
  return OPTION_KINDS.includes(field.kind)
}

function byPosition(fields: FieldDefinition[]) {
  return [...fields].sort((a, b) => a.position - b.position)
}

/** Inline input that looks like text until hovered or focused (as in the status editor). */
const INLINE_INPUT =
  "h-7 border-transparent bg-transparent px-1.5 shadow-none hover:border-input focus-visible:border-input dark:bg-transparent"

export function FieldEditor({
  listId,
  fields,
  setFields,
  canEdit,
}: {
  listId: string
  fields: FieldDefinition[]
  setFields: React.Dispatch<React.SetStateAction<FieldDefinition[]>>
  /** Workspace owner/admin. Members get a read-only list. */
  canEdit: boolean
}) {
  const [ordered, setOrdered] = useState(() => byPosition(fields))
  const [reorderError, setReorderError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<FieldDefinition | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const {
    fields: deletedFields,
    setFields: setDeletedFields,
    refetch: refetchDeleted,
  } = useListCustomFields(canEdit ? listId : undefined, { deleted: true })

  useEffect(() => {
    Promise.resolve().then(() => setOrdered(byPosition(fields)))
  }, [fields])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  async function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    const oldIndex = ordered.findIndex((f) => f.id === active.id)
    const newIndex = ordered.findIndex((f) => f.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return

    const next = arrayMove(ordered, oldIndex, newIndex)
    setOrdered(next)
    setReorderError(null)
    try {
      const updated = await api.patch<FieldDefinition[]>(
        `/lists/${listId}/custom-fields/reorder`,
        { field_ids: next.map((f) => f.id) }
      )
      setFields(updated)
    } catch (err) {
      setReorderError((err as Error).message)
      setOrdered(byPosition(fields)) // revert to last known-good order
    }
  }

  async function handleUpdate(
    fieldId: string,
    data: { name?: string; options?: { id?: string; label: string; color: StatusColor }[] }
  ) {
    const updated = await api.put<FieldDefinition>(`/custom-fields/${fieldId}`, data)
    setFields((prev) => prev.map((f) => (f.id === fieldId ? updated : f)))
  }

  async function handleDelete() {
    if (!pendingDelete) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await api.delete(`/custom-fields/${pendingDelete.id}`)
      setFields((prev) => prev.filter((f) => f.id !== pendingDelete.id))
      if (expandedId === pendingDelete.id) setExpandedId(null)
      setPendingDelete(null)
      refetchDeleted()
    } catch (err) {
      setDeleteError((err as Error).message)
    } finally {
      setDeleting(false)
    }
  }

  async function handleRestore(field: FieldDefinition) {
    const restored = await api.post<FieldDefinition>(`/custom-fields/${field.id}/restore`, {})
    setFields((prev) => [...prev, restored])
    setDeletedFields((prev) => prev.filter((f) => f.id !== field.id))
  }

  if (!canEdit) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground">
          Only workspace owners and admins can change fields.
        </p>
        {ordered.length === 0 ? (
          <EmptyFields />
        ) : (
          <ul className="divide-y rounded-lg border">
            {ordered.map((field) => (
              <li key={field.id} className="flex flex-col gap-1 px-2.5 py-2">
                <FieldSummary field={field} />
                {hasOptions(field) && field.options.length > 0 && (
                  <span className="flex flex-wrap gap-x-3 gap-y-1 pl-5.5 text-xs">
                    {field.options.map((option) => (
                      <FieldOptionLabel key={option.id} option={option} />
                    ))}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {reorderError && (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertDescription>{reorderError}</AlertDescription>
        </Alert>
      )}

      {ordered.length === 0 ? (
        <EmptyFields />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={ordered.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="divide-y rounded-lg border">
              {ordered.map((field) => (
                <SortableFieldRow
                  key={field.id}
                  field={field}
                  expanded={expandedId === field.id}
                  onToggleOptions={() =>
                    setExpandedId((current) => (current === field.id ? null : field.id))
                  }
                  onUpdate={handleUpdate}
                  onDelete={() => {
                    setDeleteError(null)
                    setPendingDelete(field)
                  }}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <CreateFieldDialog
        listId={listId}
        onCreated={(field) => {
          setFields((prev) => [...prev, field])
          if (hasOptions(field)) setExpandedId(field.id)
        }}
      >
        <Button variant="outline" size="sm" className="w-fit">
          <Plus />
          Add field
        </Button>
      </CreateFieldDialog>

      {deletedFields.length > 0 && (
        <DeletedFields fields={deletedFields} onRestore={handleRestore} />
      )}

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{pendingDelete?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              The field disappears from this list&apos;s work items, filters and
              forms. Its values are kept, and you can restore the field from
              Deleted fields to bring them back.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="danger" disabled={deleting} onClick={handleDelete}>
              {deleting && <Spinner />}
              Delete field
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function EmptyFields() {
  return (
    <p className="rounded-lg border px-2.5 py-6 text-center text-xs text-subtle-foreground">
      No custom fields yet.
    </p>
  )
}

function FieldSummary({ field }: { field: FieldDefinition }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <FieldKindIcon kind={field.kind} className="text-muted-foreground" />
      <span className="truncate font-medium">{field.name}</span>
      <span className="shrink-0 text-xs text-muted-foreground">
        {FIELD_KIND_LABELS[field.kind]}
      </span>
    </span>
  )
}

function SortableFieldRow({
  field,
  expanded,
  onToggleOptions,
  onUpdate,
  onDelete,
}: {
  field: FieldDefinition
  expanded: boolean
  onToggleOptions: () => void
  onUpdate: (
    fieldId: string,
    data: { name?: string; options?: { id?: string; label: string; color: StatusColor }[] }
  ) => Promise<void>
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: field.id })
  const [name, setName] = useState(field.name)
  const [renameError, setRenameError] = useState<string | null>(null)

  useEffect(() => {
    Promise.resolve().then(() => setName(field.name))
  }, [field.name])

  async function commitName() {
    const trimmed = name.trim()
    if (!trimmed || trimmed === field.name) {
      setName(field.name)
      setRenameError(null)
      return
    }
    try {
      await onUpdate(field.id, { name: trimmed })
      setRenameError(null)
    } catch (err) {
      setRenameError((err as Error).message)
    }
  }

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("relative bg-background first:rounded-t-lg last:rounded-b-lg", isDragging && "z-10 opacity-50")}
    >
      <div className="flex items-center gap-1.5 px-1.5 py-1">
        <button
          type="button"
          className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
          <span className="sr-only">Drag to reorder {field.name}</span>
        </button>
        <FieldKindIcon kind={field.kind} className="text-muted-foreground" />
        <Input
          aria-label="Field name"
          aria-invalid={renameError ? true : undefined}
          value={name}
          maxLength={255}
          onChange={(e) => setName(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur()
            if (e.key === "Escape") {
              setName(field.name)
              setRenameError(null)
            }
          }}
          className={cn(INLINE_INPUT, "min-w-0 flex-1 font-medium")}
        />
        <span className="shrink-0 text-xs text-muted-foreground">
          {FIELD_KIND_LABELS[field.kind]}
        </span>
        {hasOptions(field) && (
          <Button
            variant="ghost"
            size="sm"
            aria-expanded={expanded}
            onClick={onToggleOptions}
            className="text-muted-foreground"
          >
            {field.options.length} {field.options.length === 1 ? "option" : "options"}
            <ChevronDown className={cn("transition-transform", expanded && "rotate-180")} />
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label={`${field.name} actions`}>
                <MoreHorizontal />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {renameError && (
        <p className="px-12 pb-1.5 text-xs text-danger">{renameError}</p>
      )}
      {expanded && (
        <OptionsEditor
          field={field}
          onSave={(options) => onUpdate(field.id, { options })}
          onClose={onToggleOptions}
        />
      )}
    </li>
  )
}

type DraftOption = {
  /** The option id, or a local key for an option that isn't saved yet. */
  key: string
  id?: string
  label: string
  color: StatusColor
}

function toDraft(field: FieldDefinition): DraftOption[] {
  return field.options.map((o) => ({ key: o.id, id: o.id, label: o.label, color: o.color }))
}

/**
 * Edits a dropdown / multi-select field's options as a local draft, saved in
 * one PUT (the BE replaces the whole list, in display order). Existing options
 * keep their `id`, so work items that use them are unaffected by a rename.
 */
function OptionsEditor({
  field,
  onSave,
  onClose,
}: {
  field: FieldDefinition
  onSave: (options: { id?: string; label: string; color: StatusColor }[]) => Promise<void>
  onClose: () => void
}) {
  const [draft, setDraft] = useState(() => toDraft(field))
  const [newLabel, setNewLabel] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const removedCount = field.options.filter(
    (o) => !draft.some((d) => d.id === o.id)
  ).length
  const dirty =
    newLabel.trim() !== "" ||
    JSON.stringify(draft.map(({ id, label, color }) => ({ id, label, color }))) !==
      JSON.stringify(field.options.map(({ id, label, color }) => ({ id, label, color })))
  const hasEmptyLabel = draft.some((o) => !o.label.trim())

  function update(key: string, patch: Partial<DraftOption>) {
    setDraft((prev) => prev.map((o) => (o.key === key ? { ...o, ...patch } : o)))
  }

  /** Adds the pending label (if any) to `options`; returns the new list. */
  function withNewOption(options: DraftOption[]): DraftOption[] {
    const label = newLabel.trim()
    if (!label) return options
    // Cycle the palette like the BE does for options without a color.
    const color = STATUS_COLORS[options.length % STATUS_COLORS.length]
    return [...options, { key: crypto.randomUUID(), label, color }]
  }

  function addOption() {
    if (!newLabel.trim()) return
    setDraft((prev) => withNewOption(prev))
    setNewLabel("")
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    setDraft((prev) => {
      const oldIndex = prev.findIndex((o) => o.key === active.id)
      const newIndex = prev.findIndex((o) => o.key === over.id)
      return oldIndex < 0 || newIndex < 0 ? prev : arrayMove(prev, oldIndex, newIndex)
    })
  }

  async function handleSave() {
    // A label typed but not yet added with Enter is saved too.
    const options = withNewOption(draft)
    setSaving(true)
    setError(null)
    try {
      await onSave(options.map(({ id, label, color }) => ({ id, label: label.trim(), color })))
      setNewLabel("")
      onClose()
    } catch (err) {
      setDraft(options)
      setNewLabel("")
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 border-t py-2 pr-2 pl-12">
      {draft.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={draft.map((o) => o.key)} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col gap-0.5">
              {draft.map((option) => (
                <SortableOptionRow
                  key={option.key}
                  option={option}
                  onChange={(patch) => update(option.key, patch)}
                  onRemove={() => setDraft((prev) => prev.filter((o) => o.key !== option.key))}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <div className="flex items-center gap-1.5 pl-5.5">
        <Plus className="size-3.5 shrink-0 text-muted-foreground" />
        <Input
          aria-label="New option"
          placeholder="Add option"
          value={newLabel}
          maxLength={255}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              addOption()
            }
          }}
          className={cn(INLINE_INPUT, "max-w-64 flex-1")}
        />
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}
      {removedCount > 0 && (
        <p className="text-xs text-muted-foreground">
          Work items set to a removed option will show no value for {field.name}.
        </p>
      )}

      <div className="flex items-center gap-2">
        <Button
          variant="primary"
          size="sm"
          disabled={!dirty || hasEmptyLabel || saving}
          onClick={handleSave}
        >
          {saving && <Spinner />}
          Save options
        </Button>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

function SortableOptionRow({
  option,
  onChange,
  onRemove,
}: {
  option: DraftOption
  onChange: (patch: Partial<DraftOption>) => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: option.key })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("flex items-center gap-1.5", isDragging && "opacity-50")}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
        <span className="sr-only">Drag to reorder {option.label}</span>
      </button>
      <StatusColorPicker value={option.color} onChange={(color) => onChange({ color })} />
      <Input
        aria-label="Option label"
        aria-invalid={!option.label.trim() ? true : undefined}
        value={option.label}
        maxLength={255}
        onChange={(e) => onChange({ label: e.target.value })}
        className={cn(INLINE_INPUT, "max-w-64 flex-1")}
      />
      <Button variant="ghost" size="icon-sm" aria-label={`Remove ${option.label}`} onClick={onRemove}>
        <X />
      </Button>
    </li>
  )
}

function DeletedFields({
  fields,
  onRestore,
}: {
  fields: FieldDefinition[]
  onRestore: (field: FieldDefinition) => Promise<void>
}) {
  return (
    <section className="flex flex-col gap-2 border-t pt-4">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-xs font-medium text-muted-foreground">Deleted fields</h3>
        <p className="text-xs text-subtle-foreground">
          Values are kept while a field is deleted. Restoring it brings them back.
        </p>
      </div>
      <ul className="divide-y rounded-lg border">
        {fields.map((field) => (
          <DeletedFieldRow key={field.id} field={field} onRestore={onRestore} />
        ))}
      </ul>
    </section>
  )
}

function DeletedFieldRow({
  field,
  onRestore,
}: {
  field: FieldDefinition
  onRestore: (field: FieldDefinition) => Promise<void>
}) {
  const [restoring, setRestoring] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRestore() {
    setRestoring(true)
    setError(null)
    try {
      await onRestore(field)
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 409
          ? `A field named "${field.name}" already exists. Rename that field, then restore this one.`
          : (err as Error).message
      )
      setRestoring(false)
    }
  }

  return (
    <li className="flex flex-col gap-1 px-2.5 py-1.5">
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 text-muted-foreground">
          <FieldSummary field={field} />
        </span>
        {field.deleted_at && (
          <span className="shrink-0 text-xs text-subtle-foreground">
            Deleted {format(new Date(field.deleted_at), "MMM d")}
          </span>
        )}
        <Button variant="outline" size="sm" disabled={restoring} onClick={handleRestore}>
          {restoring && <Spinner />}
          Restore
        </Button>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
    </li>
  )
}
