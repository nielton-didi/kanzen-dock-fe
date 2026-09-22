"use client"

import { useRef, useState } from "react"
import { CircleAlert, FileIcon, Trash2, Upload } from "lucide-react"

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
import { api } from "@/lib/api"
import type { Attachment as AttachmentType } from "@/lib/types"

const MAX_FILE_SIZE = 10 * 1024 * 1024

function formatFileSize(bytes?: number) {
  if (!bytes) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function IssueAttachments({
  issueId,
  initialAttachments,
}: {
  issueId: string
  initialAttachments: AttachmentType[]
}) {
  const [attachments, setAttachments] = useState(initialAttachments)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
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
        `/issues/${issueId}/attachments`,
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

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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

        <Attachment
          state={uploading ? "uploading" : "idle"}
          orientation="vertical"
          size="sm"
        >
          <AttachmentTrigger
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          />
          <AttachmentMedia>
            <Upload />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>
              {uploading ? "Uploading..." : "Add file"}
            </AttachmentTitle>
            <AttachmentDescription>Up to 10MB</AttachmentDescription>
          </AttachmentContent>
        </Attachment>
      </AttachmentGroup>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        disabled={uploading}
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}
