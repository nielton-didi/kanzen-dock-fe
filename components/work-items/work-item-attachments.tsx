"use client"

import { useRef, useState } from "react"
import { CircleAlert, FileIcon, Paperclip, Trash2 } from "lucide-react"
import { cn } from "cn"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from "@/components/ui/attachment"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api"
import type { Attachment as AttachmentType } from "@/lib/types"

const MAX_FILE_SIZE = 10 * 1024 * 1024

function formatFileSize(bytes?: number) {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function WorkItemAttachments({
  workItemId,
  initialAttachments,
}: {
  workItemId: string
  initialAttachments: AttachmentType[]
}) {
  const [attachments, setAttachments] = useState(initialAttachments)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    setError(null)

    if (file.size > MAX_FILE_SIZE) {
      setError("File is too large - the max size is 10MB.")
      if (inputRef.current) inputRef.current.value = ""
      return
    }

    const formData = new FormData()
    formData.append("file", file)

    setUploading(true)
    try {
      const attachment = await api.upload<AttachmentType>(
        `/work-items/${workItemId}/attachments`,
        formData
      )
      setAttachments((prev) => [attachment, ...prev])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  async function handleDelete(attachmentId: string) {
    setDeletingId(attachmentId)
    setError(null)
    try {
      await api.delete(`/attachments/${attachmentId}`)
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId))
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setDeletingId(null)
    }
  }

  const hiddenInput = (
    <input
      ref={inputRef}
      type="file"
      className="hidden"
      disabled={uploading}
      onChange={(e) => handleFiles(e.target.files)}
    />
  )

  const dropzone = (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        handleFiles(e.dataTransfer.files)
      }}
      className={cn(
        "flex items-center justify-center rounded-md border border-dashed px-4 py-3 text-center text-sm text-muted-foreground",
        dragging && "border-information-border bg-information-subtle"
      )}
    >
      {uploading ? (
        "Uploading..."
      ) : (
        <>
          Drop files here or{" "}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="ml-1 underline underline-offset-2 hover:text-foreground"
          >
            browse
          </button>
        </>
      )}
    </div>
  )

  // No files yet - show a plain "Attach file" link rather than the full
  // upload grid, so the panel stays minimal until there's something to show.
  if (attachments.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        {error && (
          <Alert variant="destructive">
            <CircleAlert />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex w-fit items-center gap-2 text-sm text-muted-foreground outline-none hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
        >
          <Paperclip className="size-4" />
          {uploading ? "Uploading..." : "Attach file"}
        </button>
        {hiddenInput}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Attachments</span>
        <Badge variant="secondary">{attachments.length}</Badge>
      </div>

      {error && (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {dropzone}

      <AttachmentGroup>
        {attachments.map((attachment) => (
          <Attachment key={attachment.id} orientation="vertical" size="sm">
            <AttachmentTrigger
              render={
                <a href={attachment.file_url} target="_blank" rel="noreferrer" />
              }
            />
            <AttachmentMedia>
              <FileIcon />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>{attachment.file_name}</AttachmentTitle>
              <AttachmentDescription>
                {formatFileSize(attachment.file_size)}
              </AttachmentDescription>
            </AttachmentContent>
            <AttachmentActions>
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <AttachmentAction
                      aria-label="Delete attachment"
                      disabled={deletingId === attachment.id}
                    >
                      <Trash2 />
                    </AttachmentAction>
                  }
                />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete attachment?</AlertDialogTitle>
                    <AlertDialogDescription>
                      &quot;{attachment.file_name}&quot; will be permanently
                      deleted.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={() => handleDelete(attachment.id)}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </AttachmentActions>
          </Attachment>
        ))}
      </AttachmentGroup>

      {hiddenInput}
    </div>
  )
}
