"use client"

import { useState, type FormEvent } from "react"
import { CircleAlert } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { CustomFieldInput } from "@/components/custom-fields/custom-field-input"
import { api } from "@/lib/api"
import { fieldValueError, normalizeUrl, toPayloadValue } from "@/lib/custom-fields"
import type { DayKey } from "@/lib/dates"
import type {
  CustomFieldValue,
  FieldDefinition,
  WorkItem,
  WorkItemPriority,
  WorkItemSeverity,
  WorkItemType,
  WorkspaceMember,
} from "@/lib/types"
import {
  WORK_ITEM_PRIORITIES,
  WORK_ITEM_SEVERITIES,
  WORK_ITEM_TYPES,
  WorkItemPriorityLabel,
} from "@/components/work-items/work-item-badges"
import { WorkItemDatePicker } from "@/components/work-items/work-item-date-picker"

/** Values as they'll be sent: URLs get their https:// here, not while typing. */
function normalizeCustomValue(field: FieldDefinition, value: CustomFieldValue | null) {
  if (field.kind === "url" && typeof value === "string") return normalizeUrl(value) || null
  return value
}

export function CreateWorkItemDialog({
  listId,
  statusId,
  fields,
  workspaceMembers,
  onCreated,
  children,
}: {
  listId: string
  /** The list's custom fields, in display order. */
  fields: FieldDefinition[]
  workspaceMembers: WorkspaceMember[]
  /** Preselects the status the new work item is created into (e.g. from a status group's "+" button). */
  statusId?: string
  onCreated: (workItem: WorkItem) => void
  children: React.ReactElement
}) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [type, setType] = useState<WorkItemType>("bug")
  const [severity, setSeverity] = useState<WorkItemSeverity>("medium")
  const [priority, setPriority] = useState<WorkItemPriority>("none")
  const [startDate, setStartDate] = useState<DayKey | null>(null)
  const [dueDate, setDueDate] = useState<DayKey | null>(null)
  const [customValues, setCustomValues] = useState<Record<string, CustomFieldValue | null>>({})
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function reset() {
    setTitle("")
    setDescription("")
    setType("bug")
    setSeverity("medium")
    setPriority("none")
    setStartDate(null)
    setDueDate(null)
    setCustomValues({})
  }

  const customErrors = Object.fromEntries(
    fields.map((field) => [
      field.id,
      fieldValueError(field, normalizeCustomValue(field, customValues[field.id] ?? null)),
    ])
  )
  const hasCustomErrors = Object.values(customErrors).some(Boolean)

  /** Only set values are sent; unset is "key absent" (D2). */
  function customFieldsPayload() {
    const payload: Record<string, CustomFieldValue> = {}
    for (const field of fields) {
      const value = toPayloadValue(normalizeCustomValue(field, customValues[field.id] ?? null))
      if (value !== null) payload[field.id] = value
    }
    return payload
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (hasCustomErrors) return
    setError(null)
    setSubmitting(true)
    const custom = customFieldsPayload()
    try {
      const workItem = await api.post<WorkItem>(`/lists/${listId}/work-items`, {
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        ...(type === "bug" ? { severity } : {}),
        priority,
        ...(startDate ? { start_date: startDate } : {}),
        ...(dueDate ? { due_date: dueDate } : {}),
        ...(statusId ? { status_id: statusId } : {}),
        ...(Object.keys(custom).length ? { custom_fields: custom } : {}),
      })
      onCreated(workItem)
      reset()
      setOpen(false)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setError(null)
      }}
    >
      <DialogTrigger render={children} />
      <DialogContent className="grid-rows-[auto_minmax(0,1fr)] max-h-[85vh] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create work item</DialogTitle>
          <DialogDescription>
            Add a new work item to this list.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-col gap-4">
          <FieldGroup className="-mx-4 min-h-0 overflow-y-auto px-4">
            {error && (
              <Alert variant="destructive">
                <CircleAlert />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Field>
              <FieldLabel htmlFor="work-item-title">Title</FieldLabel>
              <Input
                id="work-item-title"
                placeholder="Login button doesn't work on Safari"
                autoFocus
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="work-item-description">Description</FieldLabel>
              <Textarea
                id="work-item-description"
                placeholder="Steps to reproduce, expected vs actual behavior..."
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="work-item-type">Type</FieldLabel>
                <Select
                  value={type}
                  onValueChange={(v) => setType(v as WorkItemType)}
                >
                  <SelectTrigger id="work-item-type" className="w-full">
                    <SelectValue>
                      {(value: WorkItemType) => WORK_ITEM_TYPES.find((t) => t.value === value)?.label}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {WORK_ITEM_TYPES.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="work-item-priority">Priority</FieldLabel>
                <Select
                  value={priority}
                  onValueChange={(v) => setPriority(v as WorkItemPriority)}
                >
                  <SelectTrigger id="work-item-priority" className="w-full">
                    <SelectValue>
                      {(value: WorkItemPriority) => <WorkItemPriorityLabel priority={value} />}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {WORK_ITEM_PRIORITIES.map(({ value }) => (
                      <SelectItem key={value} value={value}>
                        <WorkItemPriorityLabel priority={value} />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              {type === "bug" && (
                <Field>
                  <FieldLabel htmlFor="work-item-severity">Severity</FieldLabel>
                  <Select
                    value={severity}
                    onValueChange={(v) => setSeverity(v as WorkItemSeverity)}
                  >
                    <SelectTrigger id="work-item-severity" className="w-full">
                      <SelectValue>
                        {(value: WorkItemSeverity) =>
                          WORK_ITEM_SEVERITIES.find((s) => s.value === value)?.label
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {WORK_ITEM_SEVERITIES.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel>Start date</FieldLabel>
                <WorkItemDatePicker
                  variant="field"
                  label="Start date"
                  value={startDate}
                  max={dueDate}
                  onChange={setStartDate}
                />
              </Field>
              <Field>
                <FieldLabel>Due date</FieldLabel>
                <WorkItemDatePicker
                  variant="field"
                  label="Due date"
                  value={dueDate}
                  min={startDate}
                  highlightDue
                  onChange={setDueDate}
                />
              </Field>
            </div>
            {fields.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {fields.map((field) => {
                  const inputId = `work-item-cf-${field.id}`
                  return (
                    <Field
                      key={field.id}
                      data-invalid={Boolean(customErrors[field.id]) || undefined}
                      className={field.kind === "text" ? "col-span-2" : undefined}
                    >
                      <FieldLabel htmlFor={inputId}>{field.name}</FieldLabel>
                      <CustomFieldInput
                        variant="field"
                        id={inputId}
                        field={field}
                        value={customValues[field.id] ?? null}
                        members={workspaceMembers}
                        error={Boolean(customErrors[field.id])}
                        onChange={(value) =>
                          setCustomValues((prev) => ({ ...prev, [field.id]: value }))
                        }
                      />
                      {customErrors[field.id] && (
                        <FieldError className="text-xs">{customErrors[field.id]}</FieldError>
                      )}
                    </Field>
                  )
                })}
              </div>
            )}
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button variant="primary" type="submit" disabled={submitting || !title.trim() || hasCustomErrors}>
              {submitting && <Spinner />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
