"use client"

import { useState, type FormEvent } from "react"
import { CircleAlert } from "lucide-react"

import {
  FIELD_KIND_LABELS,
  FieldKindIcon,
} from "@/components/custom-fields/custom-field-display"
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
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { api } from "@/lib/api"
import type { FieldDefinition, FieldKind } from "@/lib/types"

const FIELD_KINDS = Object.keys(FIELD_KIND_LABELS) as FieldKind[]

function KindLabel({ kind }: { kind: FieldKind }) {
  return (
    <span className="inline-flex items-center gap-2">
      <FieldKindIcon kind={kind} className="text-muted-foreground" />
      {FIELD_KIND_LABELS[kind]}
    </span>
  )
}

export function CreateFieldDialog({
  listId,
  onCreated,
  children,
}: {
  listId: string
  onCreated: (field: FieldDefinition) => void
  children: React.ReactElement
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [kind, setKind] = useState<FieldKind>("text")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const field = await api.post<FieldDefinition>(`/lists/${listId}/custom-fields`, {
        name: name.trim(),
        kind,
      })
      onCreated(field)
      setName("")
      setKind("text")
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
          <DialogTitle>Add field</DialogTitle>
          <DialogDescription>
            Fields show up on every work item in this list.
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
              <FieldLabel htmlFor="field-name">Name</FieldLabel>
              <Input
                id="field-name"
                placeholder="Customer"
                autoFocus
                required
                maxLength={255}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="field-kind">Kind</FieldLabel>
              <Select value={kind} onValueChange={(v) => v && setKind(v as FieldKind)}>
                <SelectTrigger id="field-kind" className="w-full">
                  <SelectValue>{(value: FieldKind) => <KindLabel kind={value} />}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {FIELD_KINDS.map((k) => (
                    <SelectItem key={k} value={k}>
                      <KindLabel kind={k} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription className="text-xs">The kind can&apos;t be changed later.</FieldDescription>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button variant="primary" type="submit" disabled={submitting || !name.trim()}>
              {submitting && <Spinner />}
              Add
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
