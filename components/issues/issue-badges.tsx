import { cn } from "cn"

import { Badge } from "@/components/ui/badge"
import type {
  IssuePriority,
  IssueSeverity,
  IssueType,
  Status,
  StatusColor,
} from "@/lib/types"

export const ISSUE_TYPES: { value: IssueType; label: string }[] = [
  { value: "bug", label: "Bug" },
  { value: "task", label: "Task" },
]

/** Fixed palette a status's color is chosen from — keep in sync with the backend's STATUS_COLORS. */
export const STATUS_COLORS: StatusColor[] = [
  "gray",
  "blue",
  "teal",
  "green",
  "lime",
  "yellow",
  "orange",
  "red",
  "magenta",
  "purple",
]

export const ISSUE_SEVERITIES: { value: IssueSeverity; label: string }[] = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
]

export const ISSUE_PRIORITIES: { value: IssuePriority; label: string }[] = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
]

const TYPE_CLASSNAMES: Record<IssueType, string> = {
  bug: "bg-red-500/10 text-red-600 dark:text-red-400",
  task: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
}

export const STATUS_COLOR_CLASSNAMES: Record<StatusColor, string> = {
  gray: "bg-status-gray/10 text-status-gray",
  blue: "bg-status-blue/10 text-status-blue",
  teal: "bg-status-teal/10 text-status-teal",
  green: "bg-status-green/10 text-status-green",
  lime: "bg-status-lime/10 text-status-lime",
  yellow: "bg-status-yellow/10 text-status-yellow",
  orange: "bg-status-orange/10 text-status-orange",
  red: "bg-status-red/10 text-status-red",
  magenta: "bg-status-magenta/10 text-status-magenta",
  purple: "bg-status-purple/10 text-status-purple",
}

/** Solid swatch classes (no /10 tint) — used for the color-picker dots. */
export const STATUS_SWATCH_CLASSNAMES: Record<StatusColor, string> = {
  gray: "bg-status-gray",
  blue: "bg-status-blue",
  teal: "bg-status-teal",
  green: "bg-status-green",
  lime: "bg-status-lime",
  yellow: "bg-status-yellow",
  orange: "bg-status-orange",
  red: "bg-status-red",
  magenta: "bg-status-magenta",
  purple: "bg-status-purple",
}

const SEVERITY_CLASSNAMES: Record<IssueSeverity, string> = {
  critical: "bg-red-500/10 text-red-600 dark:text-red-400",
  high: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  low: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
}

const PRIORITY_CLASSNAMES: Record<IssuePriority, string> = {
  high: "bg-red-500/10 text-red-600 dark:text-red-400",
  medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  low: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
}

const TYPE_LABELS = Object.fromEntries(
  ISSUE_TYPES.map((t) => [t.value, t.label])
) as Record<IssueType, string>
const SEVERITY_LABELS = Object.fromEntries(
  ISSUE_SEVERITIES.map((s) => [s.value, s.label])
) as Record<IssueSeverity, string>
const PRIORITY_LABELS = Object.fromEntries(
  ISSUE_PRIORITIES.map((p) => [p.value, p.label])
) as Record<IssuePriority, string>

export function IssueTypeBadge({
  type,
  className,
}: {
  type: IssueType
  className?: string
}) {
  return (
    <Badge
      variant="outline"
      className={cn("border-transparent", TYPE_CLASSNAMES[type], className)}
    >
      {TYPE_LABELS[type]}
    </Badge>
  )
}

export function IssueStatusBadge({
  status,
  className,
}: {
  status: Status
  className?: string
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent",
        STATUS_COLOR_CLASSNAMES[status.color],
        className
      )}
    >
      {status.name}
    </Badge>
  )
}

export function IssueSeverityBadge({
  severity,
  className,
}: {
  severity: IssueSeverity | null
  className?: string
}) {
  if (severity === null) return null
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent",
        SEVERITY_CLASSNAMES[severity],
        className
      )}
    >
      {SEVERITY_LABELS[severity]}
    </Badge>
  )
}

export function IssuePriorityBadge({
  priority,
  className,
}: {
  priority: IssuePriority
  className?: string
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent",
        PRIORITY_CLASSNAMES[priority],
        className
      )}
    >
      {PRIORITY_LABELS[priority]}
    </Badge>
  )
}
