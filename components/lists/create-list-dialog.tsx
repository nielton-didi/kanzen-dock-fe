"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import {
  Bug,
  Calendar,
  CircleAlert,
  Code,
  LayoutList,
  LifeBuoy,
  Lightbulb,
  ListChecks,
  type LucideIcon,
} from "lucide-react"
import { cn } from "cn"

import { FieldKindIcon } from "@/components/custom-fields/custom-field-display"
import { STATUS_SWATCH_CLASSNAMES } from "@/components/work-items/work-item-badges"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { useWorkspaceData } from "@/contexts/workspace-context"
import { useListTemplates } from "@/hooks/use-list-templates"
import type { ListTemplate } from "@/lib/types"

const DEFAULT_TEMPLATE_KEY = "general-tasks"

// Template icons are lucide names from the BE; unknown names fall back.
const TEMPLATE_ICONS: Record<string, LucideIcon> = {
  "list-checks": ListChecks,
  bug: Bug,
  code: Code,
  lightbulb: Lightbulb,
  "life-buoy": LifeBuoy,
  calendar: Calendar,
}

function TemplateIcon({ name, className }: { name: string; className?: string }) {
  const Icon = TEMPLATE_ICONS[name] ?? LayoutList
  return <Icon className={cn("size-4 shrink-0", className)} />
}

export function CreateListDialog({
  projectId,
  children,
}: {
  projectId: string
  children: React.ReactElement
}) {
  const { createList } = useWorkspaceData()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [templateKey, setTemplateKey] = useState(DEFAULT_TEMPLATE_KEY)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { templates, error: templatesError, loading: templatesLoading } =
    useListTemplates(open)

  const selected = templates?.find((t) => t.key === templateKey)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      // Without loaded templates, send no key: the BE defaults to General tasks.
      const list = await createList(projectId, name.trim(), selected?.key)
      setName("")
      setTemplateKey(DEFAULT_TEMPLATE_KEY)
      setOpen(false)
      router.push(`/projects/${projectId}/lists/${list.id}`)
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
        if (!next) {
          setError(null)
          setTemplateKey(DEFAULT_TEMPLATE_KEY)
        }
      }}
    >
      <DialogTrigger render={children} />
      <DialogContent className="grid-rows-[auto_minmax(0,1fr)] max-h-[85vh] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create list</DialogTitle>
          <DialogDescription>
            A template sets the list&apos;s statuses and fields. You can change
            both later in list settings.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-col gap-4">
          <FieldGroup className="-mx-4 min-h-0 gap-4 overflow-y-auto px-4">
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
                placeholder="Backlog"
                autoFocus
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel id="list-template-label">Template</FieldLabel>
              {templatesError ? (
                <p className="text-xs text-muted-foreground">
                  Couldn&apos;t load templates. The list will use General tasks.
                </p>
              ) : templatesLoading || !templates ? (
                <div className="flex flex-col gap-1">
                  {Array.from({ length: 6 }, (_, i) => (
                    <Skeleton key={i} className="h-11 w-full" />
                  ))}
                </div>
              ) : (
                <TemplatePicker
                  templates={templates}
                  value={templateKey}
                  onChange={setTemplateKey}
                />
              )}
            </Field>
            {selected && <TemplatePreview template={selected} />}
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button variant="primary" type="submit" disabled={submitting || !name.trim()}>
              {submitting && <Spinner />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function TemplatePicker({
  templates,
  value,
  onChange,
}: {
  templates: ListTemplate[]
  value: string
  onChange: (key: string) => void
}) {
  return (
    <RadioGroup
      aria-labelledby="list-template-label"
      value={value}
      onValueChange={(next) => onChange(String(next))}
      // No overflow-hidden: the radio's enlarged hit area pokes past the
      // edge, and focusing it would scroll a clipped container sideways.
      className="gap-0 divide-y rounded-lg border"
    >
      {templates.map((template) => (
        <label
          key={template.key}
          className={cn(
            "flex min-w-0 cursor-pointer items-center gap-2.5 px-2.5 py-1.5 first:rounded-t-lg last:rounded-b-lg hover:bg-accent",
            template.key === value && "bg-muted hover:bg-muted"
          )}
        >
          <TemplateIcon name={template.icon} className="text-muted-foreground" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="font-medium">{template.name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {template.description}
            </span>
          </span>
          <RadioGroupItem value={template.key} />
        </label>
      ))}
    </RadioGroup>
  )
}

/** What the selected template will copy into the list. */
function TemplatePreview({ template }: { template: ListTemplate }) {
  return (
    <div className="flex flex-col gap-2 text-xs">
      <div className="flex flex-col gap-1">
        <span className="font-medium text-muted-foreground">Statuses</span>
        <ul className="flex flex-wrap gap-x-3 gap-y-1">
          {template.statuses.map((status) => (
            <li key={status.name} className="inline-flex items-center gap-1.5">
              <span
                className={cn("size-2 rounded-full", STATUS_SWATCH_CLASSNAMES[status.color])}
              />
              {status.name}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col gap-1">
        <span className="font-medium text-muted-foreground">Fields</span>
        {template.fields.length === 0 ? (
          <span className="text-subtle-foreground">No custom fields</span>
        ) : (
          <ul className="flex flex-wrap gap-x-3 gap-y-1">
            {template.fields.map((field) => (
              <li key={field.name} className="inline-flex items-center gap-1.5">
                <FieldKindIcon kind={field.kind} className="text-muted-foreground" />
                {field.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
