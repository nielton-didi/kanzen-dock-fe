"use client"

import { useState } from "react"
import { ChevronDownIcon, ExternalLink } from "lucide-react"
import { cn } from "cn"

import {
  CustomFieldDisplay,
  FieldOptionLabel,
  MemberLabel,
} from "@/components/custom-fields/custom-field-display"
import { WorkItemDatePicker } from "@/components/work-items/work-item-date-picker"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import { fieldValueError, normalizeUrl } from "@/lib/custom-fields"
import type { CustomFieldValue, FieldDefinition, WorkspaceMember } from "@/lib/types"

type Variant = "inline" | "field"

interface CustomFieldInputProps {
  field: FieldDefinition
  /** Already read through `readFieldValue`; `null` = unset. */
  value: CustomFieldValue | null
  /** `null` unsets the field. Inline text-like kinds call this on blur/Enter;
   * `variant="field"` calls it on every keystroke (a controlled form input). */
  onChange: (value: CustomFieldValue | null) => void
  members: WorkspaceMember[]
  /** `"inline"`: quiet click-to-edit (detail panel). `"field"`: looks like a
   * form input (dialogs). */
  variant?: Variant
  id?: string
  loading?: boolean
  disabled?: boolean
  /** Server-side error for this field; outlines the control. */
  error?: boolean
  placeholder?: React.ReactNode
  className?: string
}

const INLINE_TRIGGER =
  "flex min-h-6 w-fit max-w-full items-center gap-1.5 rounded-md px-1 py-0.5 text-left text-sm outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none data-popup-open:bg-muted"

const FIELD_TRIGGER =
  "flex h-8 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-2.5 text-left text-sm outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none data-popup-open:bg-muted dark:bg-input/30"

const INLINE_INPUT =
  "w-full min-w-0 rounded-md bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-muted-foreground hover:bg-muted focus-visible:bg-muted aria-invalid:ring-1 aria-invalid:ring-destructive"

const FIELD_INPUT =
  "h-8 w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 text-sm outline-none placeholder:text-subtle-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30"

/**
 * Edit control for one custom field, one branch per kind. Used by the detail
 * panel (`inline`, saves each change) and the create dialog (`field`,
 * controlled), so a new field works everywhere with no field-specific code.
 */
export function CustomFieldInput(props: CustomFieldInputProps) {
  const { field } = props
  switch (field.kind) {
    case "text":
    case "number":
    case "url":
      return props.variant === "field" ? <FieldTextInput {...props} /> : <InlineTextInput {...props} />
    case "dropdown":
    case "person":
      return <SingleSelectInput {...props} />
    case "multi_select":
      return <MultiSelectInput {...props} />
    case "date":
      return (
        <WorkItemDatePicker
          label={field.name}
          value={props.value === null ? null : String(props.value)}
          onChange={props.onChange}
          variant={props.variant}
          loading={props.loading}
          disabled={props.disabled}
          error={props.error}
          placeholder={props.placeholder}
          className={props.className}
        />
      )
    case "checkbox":
      return <CheckboxInput {...props} />
  }
}

/** Text / number / url typed value → stored value (`null` = unset). */
function parseDraft(field: FieldDefinition, draft: string): CustomFieldValue | null {
  if (field.kind === "number") return draft.trim() === "" ? null : Number(draft)
  if (field.kind === "url") return normalizeUrl(draft) || null
  return draft === "" ? null : draft
}

/** URLs use `type="text"` (with `inputMode="url"`): the browser's own
 * `type="url"` validation would block bare domains that `normalizeUrl` accepts. */
function inputProps(field: FieldDefinition) {
  if (field.kind === "number") return { type: "number", step: "any" }
  if (field.kind === "url") return { type: "text", inputMode: "url" as const }
  return { type: "text" }
}

function FieldTextInput({
  field,
  value,
  onChange,
  id,
  disabled,
  error,
  className,
}: CustomFieldInputProps) {
  const common = {
    id,
    disabled,
    "aria-invalid": error || undefined,
    className: cn(FIELD_INPUT, className),
  }

  if (field.kind === "text") {
    return (
      <textarea
        {...common}
        rows={1}
        value={value === null ? "" : String(value)}
        onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
        className={cn(common.className, "field-sizing-content h-auto min-h-8 resize-none py-1.5")}
      />
    )
  }

  // URLs are stored as typed here and normalized (https:// added) on submit,
  // so the field doesn't rewrite itself while the user is typing.
  return (
    <input
      {...common}
      {...inputProps(field)}
      placeholder={field.kind === "url" ? "https://" : undefined}
      value={value === null ? "" : String(value)}
      onChange={(e) => {
        const raw = e.target.value
        if (field.kind === "number") onChange(raw === "" ? null : Number(raw))
        else onChange(raw === "" ? null : raw)
      }}
    />
  )
}

/** Click-to-edit input: keeps a local draft and saves on blur / Enter,
 * reverts on Escape. Invalid input shows a message and isn't saved. */
function InlineTextInput(props: CustomFieldInputProps) {
  // Remount on external value changes so the draft always starts from the
  // saved value (e.g. after a save or when navigating to another item).
  return <InlineTextInputInner key={String(props.value)} {...props} />
}

function InlineTextInputInner({
  field,
  value,
  onChange,
  id,
  loading,
  disabled,
  error,
  className,
}: CustomFieldInputProps) {
  const initial = value === null ? "" : String(value)
  const [draft, setDraft] = useState(initial)
  const [invalid, setInvalid] = useState<string | null>(null)

  function commit() {
    const next = parseDraft(field, draft)
    const message = fieldValueError(field, next)
    setInvalid(message)
    if (message) return
    if (next !== value) onChange(next)
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
    if (event.key === "Escape") {
      // Keep the surrounding dialog open; just drop the edit.
      event.stopPropagation()
      setDraft(initial)
      setInvalid(null)
      requestAnimationFrame(() => (event.target as HTMLElement).blur())
    } else if (event.key === "Enter" && !(field.kind === "text" && event.shiftKey)) {
      event.preventDefault()
      event.currentTarget.blur()
    }
  }

  const common = {
    id,
    value: draft,
    disabled: disabled || loading,
    placeholder: "Not set",
    "aria-label": field.name,
    "aria-invalid": Boolean(invalid || error) || undefined,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setDraft(e.target.value)
      setInvalid(null)
    },
    onBlur: commit,
    onKeyDown,
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
  }

  return (
    <div className={cn("flex min-w-0 flex-1 flex-col gap-0.5", className)}>
      <div className="flex min-w-0 items-center gap-1">
        {field.kind === "text" ? (
          <textarea
            {...common}
            rows={1}
            className={cn(INLINE_INPUT, "field-sizing-content resize-none")}
          />
        ) : (
          <input
            {...common}
            {...inputProps(field)}
            className={cn(INLINE_INPUT, field.kind === "number" && "tabular-nums")}
          />
        )}
        {loading && <Spinner className="size-3.5 shrink-0 text-muted-foreground" />}
        {field.kind === "url" && value !== null && !loading && (
          <a
            href={String(value)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <ExternalLink className="size-3.5" />
            <span className="sr-only">Open {field.name}</span>
          </a>
        )}
      </div>
      {invalid && <span className="px-1 text-xs text-danger">{invalid}</span>}
    </div>
  )
}

/** Dropdown (option ids) and person (workspace members): pick one or None. */
function SingleSelectInput({
  field,
  value,
  onChange,
  members,
  variant = "inline",
  id,
  loading,
  disabled,
  error,
  placeholder,
  className,
}: CustomFieldInputProps) {
  const NONE = ""
  const choices =
    field.kind === "person"
      ? members.map((member) => ({ value: member.user_id, label: <MemberLabel member={member} /> }))
      : field.options.map((option) => ({ value: option.id, label: <FieldOptionLabel option={option} /> }))
  const empty = placeholder ?? <span className="text-subtle-foreground">Select…</span>

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            id={id}
            aria-label={field.name}
            disabled={disabled || loading}
            onClick={(event) => event.stopPropagation()}
            className={cn(
              variant === "field" ? FIELD_TRIGGER : INLINE_TRIGGER,
              error && "ring-1 ring-destructive",
              className
            )}
          />
        }
      >
        {loading ? (
          <Spinner className="size-3.5 text-muted-foreground" />
        ) : (
          <CustomFieldDisplay field={field} value={value} members={members} placeholder={empty} />
        )}
        {variant === "field" && (
          <ChevronDownIcon className="size-3.5 shrink-0 text-muted-foreground" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="max-h-72 w-52"
        onClick={(event) => event.stopPropagation()}
      >
        <DropdownMenuRadioGroup
          value={value === null ? NONE : String(value)}
          onValueChange={(next: string) => {
            const nextValue = next === NONE ? null : next
            if (nextValue !== value) onChange(nextValue)
          }}
        >
          <DropdownMenuRadioItem value={NONE} closeOnClick>
            <span className="text-muted-foreground">None</span>
          </DropdownMenuRadioItem>
          {choices.map((choice) => (
            <DropdownMenuRadioItem key={choice.value} value={choice.value} closeOnClick>
              {choice.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** Toggles build up a local selection while the menu is open and are saved
 * once on close, so quick toggles don't race each other as separate saves. */
function MultiSelectInput({
  field,
  value,
  onChange,
  members,
  variant = "inline",
  id,
  loading,
  disabled,
  error,
  placeholder,
  className,
}: CustomFieldInputProps) {
  const selected = Array.isArray(value) ? value : []
  const [draft, setDraft] = useState<string[] | null>(null)
  const current = draft ?? selected
  const empty = placeholder ?? <span className="text-subtle-foreground">Select…</span>

  function handleOpenChange(open: boolean) {
    if (open) {
      setDraft(selected)
      return
    }
    if (draft) {
      // Save in the field's option order so an unchanged set compares equal.
      const next = field.options.filter((o) => draft.includes(o.id)).map((o) => o.id)
      if (next.join() !== selected.join()) onChange(next.length ? next : null)
    }
    setDraft(null)
  }

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            id={id}
            aria-label={field.name}
            disabled={disabled || loading}
            onClick={(event) => event.stopPropagation()}
            className={cn(
              variant === "field" ? cn(FIELD_TRIGGER, "h-auto min-h-8 py-1") : INLINE_TRIGGER,
              error && "ring-1 ring-destructive",
              className
            )}
          />
        }
      >
        {loading ? (
          <Spinner className="size-3.5 text-muted-foreground" />
        ) : (
          <CustomFieldDisplay
            field={field}
            value={current.length ? current : null}
            members={members}
            placeholder={empty}
          />
        )}
        {variant === "field" && (
          <ChevronDownIcon className="size-3.5 shrink-0 text-muted-foreground" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="max-h-72 w-52"
        onClick={(event) => event.stopPropagation()}
      >
        {field.options.length === 0 ? (
          <div className="px-1.5 py-1 text-xs text-muted-foreground">No options yet</div>
        ) : (
          field.options.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.id}
              checked={current.includes(option.id)}
              onCheckedChange={(checked) =>
                setDraft((prev) => {
                  const base = prev ?? selected
                  return checked ? [...base, option.id] : base.filter((id) => id !== option.id)
                })
              }
            >
              <FieldOptionLabel option={option} />
            </DropdownMenuCheckboxItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function CheckboxInput({
  field,
  value,
  onChange,
  variant = "inline",
  id,
  loading,
  disabled,
  error,
  className,
}: CustomFieldInputProps) {
  return (
    <div
      className={cn("flex items-center", variant === "field" ? "h-8" : "min-h-6 px-1", className)}
      onClick={(event) => event.stopPropagation()}
    >
      {loading ? (
        <Spinner className="size-3.5 text-muted-foreground" />
      ) : (
        <Checkbox
          id={id}
          aria-label={field.name}
          checked={value === true}
          disabled={disabled}
          aria-invalid={error || undefined}
          onCheckedChange={(checked) => onChange(checked ? true : null)}
        />
      )}
    </div>
  )
}
