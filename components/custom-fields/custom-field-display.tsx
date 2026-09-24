import {
  Calendar,
  Check,
  CircleChevronDown,
  Hash,
  Link as LinkIcon,
  ListChecks,
  SquareCheck,
  Type,
  UserRound,
  type LucideIcon,
} from "lucide-react"
import { cn } from "cn"

import { STATUS_SWATCH_CLASSNAMES } from "@/components/work-items/work-item-badges"
import { DayText } from "@/components/work-items/work-item-date-picker"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { memberLabel } from "@/lib/custom-fields"
import type {
  CustomFieldValue,
  FieldDefinition,
  FieldKind,
  FieldOption,
  WorkspaceMember,
} from "@/lib/types"

export const FIELD_KIND_ICONS: Record<FieldKind, LucideIcon> = {
  text: Type,
  number: Hash,
  dropdown: CircleChevronDown,
  multi_select: ListChecks,
  date: Calendar,
  person: UserRound,
  checkbox: SquareCheck,
  url: LinkIcon,
}

export const FIELD_KIND_LABELS: Record<FieldKind, string> = {
  text: "Text",
  number: "Number",
  dropdown: "Dropdown",
  multi_select: "Multi-select",
  date: "Date",
  person: "Person",
  checkbox: "Checkbox",
  url: "URL",
}

export function FieldKindIcon({ kind, className }: { kind: FieldKind; className?: string }) {
  const Icon = FIELD_KIND_ICONS[kind]
  return <Icon className={cn("size-3.5 shrink-0", className)} />
}

/** Categorical option: color dot + neutral text (design-guidelines §3.3). */
export function FieldOptionLabel({
  option,
  className,
}: {
  option: FieldOption
  className?: string
}) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5", className)}>
      <span
        className={cn("size-2 shrink-0 rounded-full", STATUS_SWATCH_CLASSNAMES[option.color])}
      />
      <span className="truncate">{option.label}</span>
    </span>
  )
}

export function MemberLabel({ member }: { member: WorkspaceMember }) {
  const label = memberLabel(member)
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <Avatar size="sm">
        <AvatarImage src={member.user.avatar_url} />
        <AvatarFallback>{label.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      <span className="truncate">{label}</span>
    </span>
  )
}

/**
 * Read-only rendering of one custom field value, one branch per kind. `value`
 * must already be read through `readFieldValue` (stale ids removed); `null`
 * renders `placeholder`.
 */
export function CustomFieldDisplay({
  field,
  value,
  members,
  placeholder = <span className="text-subtle-foreground">—</span>,
  compact = false,
}: {
  field: FieldDefinition
  value: CustomFieldValue | null
  members: WorkspaceMember[]
  placeholder?: React.ReactNode
  /** One line, truncated (list rows). */
  compact?: boolean
}) {
  if (value === null) return <>{placeholder}</>

  switch (field.kind) {
    case "text":
      return (
        <span
          className={cn("min-w-0", compact ? "truncate" : "whitespace-pre-wrap break-words")}
        >
          {String(value)}
        </span>
      )
    case "number":
      return <span className="tabular-nums">{Number(value).toLocaleString()}</span>
    case "dropdown": {
      const option = field.options.find((o) => o.id === value)
      return option ? <FieldOptionLabel option={option} /> : <>{placeholder}</>
    }
    case "multi_select": {
      const ids = value as string[]
      return (
        <span
          className={cn(
            "flex min-w-0 items-center gap-x-2.5 gap-y-1",
            compact ? "overflow-hidden" : "flex-wrap"
          )}
        >
          {field.options
            .filter((o) => ids.includes(o.id))
            .map((option) => (
              <FieldOptionLabel key={option.id} option={option} />
            ))}
        </span>
      )
    }
    case "date":
      return <DayText value={String(value)} />
    case "person": {
      const member = members.find((m) => m.user_id === value)
      return member ? <MemberLabel member={member} /> : <>{placeholder}</>
    }
    case "checkbox":
      return (
        <span className="inline-flex items-center gap-1.5">
          <Check className="size-3.5 shrink-0" />
          Yes
        </span>
      )
    case "url":
      return <span className="truncate text-information">{String(value)}</span>
  }
}
