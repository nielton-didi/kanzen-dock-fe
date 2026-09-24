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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
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
import { api } from "@/lib/api"
import type { WorkItem, WorkItemPriority, WorkItemSeverity, WorkItemType } from "@/lib/types"
import {
  WORK_ITEM_PRIORITIES,
  WORK_ITEM_SEVERITIES,
  WORK_ITEM_TYPES,
} from "@/components/work-items/work-item-badges"

export function CreateWorkItemDialog({
  listId,
  statusId,
  onCreated,
  children,
}: {
  listId: string
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
  const [priority, setPriority] = useState<WorkItemPriority>("medium")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function reset() {
    setTitle("")
    setDescription("")
    setType("bug")
    setSeverity("medium")
    setPriority("medium")
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const workItem = await api.post<WorkItem>(`/lists/${listId}/work-items`, {
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        ...(type === "bug" ? { severity } : {}),
        priority,
        ...(statusId ? { status_id: statusId } : {}),
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create work item</DialogTitle>
          <DialogDescription>
            Add a new work item to this list.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup>
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
                    <SelectValue />
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
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WORK_ITEM_PRIORITIES.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
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
                      <SelectValue />
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
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={submitting || !title.trim()}>
              {submitting && <Spinner />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
