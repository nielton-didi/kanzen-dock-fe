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
import { Spinner } from "@/components/ui/spinner"
import { useWorkspaceData } from "@/contexts/workspace-context"

type CreateWorkspaceDialogProps =
  | { children: React.ReactElement; open?: undefined; onOpenChange?: undefined }
  | { children?: undefined; open: boolean; onOpenChange: (open: boolean) => void }

export function CreateWorkspaceDialog(props: CreateWorkspaceDialogProps) {
  const { createWorkspace } = useWorkspaceData()
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = props.open !== undefined
  const open = isControlled ? props.open : internalOpen
  const setOpen = isControlled ? props.onOpenChange : setInternalOpen
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await createWorkspace(name.trim())
      setName("")
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
      {props.children && <DialogTrigger render={props.children} />}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create workspace</DialogTitle>
          <DialogDescription>
            Workspaces group your projects and team members.
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
              <FieldLabel htmlFor="workspace-name">Name</FieldLabel>
              <Input
                id="workspace-name"
                placeholder="Acme Inc"
                autoFocus
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
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
