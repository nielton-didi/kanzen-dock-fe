"use client"

import { useState, type FormEvent } from "react"
import { Archive, Bug, CircleAlert, ListTodo, Sparkles } from "lucide-react"

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
import { useWorkspaceData } from "@/contexts/workspace-context"
import type { ListType } from "@/lib/types"

const LIST_TYPES: { value: ListType; label: string; icon: typeof Bug }[] = [
  { value: "bug", label: "Bug", icon: Bug },
  { value: "task", label: "Task", icon: ListTodo },
  { value: "feature", label: "Feature", icon: Sparkles },
  { value: "backlog", label: "Backlog", icon: Archive },
]

export function CreateListDialog({
  projectId,
  children,
}: {
  projectId: string
  children: React.ReactElement
}) {
  const { createList } = useWorkspaceData()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [type, setType] = useState<ListType>("bug")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await createList(projectId, name.trim(), type)
      setName("")
      setType("bug")
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
          <DialogTitle>Create list</DialogTitle>
          <DialogDescription>
            Lists group issues by type, like Bugs or Backlog.
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
              <FieldLabel htmlFor="list-name">Name</FieldLabel>
              <Input
                id="list-name"
                placeholder="Bugs"
                autoFocus
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="list-type">Type</FieldLabel>
              <Select value={type} onValueChange={(v) => setType(v as ListType)}>
                <SelectTrigger id="list-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LIST_TYPES.map(({ value, label, icon: Icon }) => (
                    <SelectItem key={value} value={value}>
                      <Icon className="size-4" />
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={submitting || !name.trim()}>
              {submitting && <Spinner />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
