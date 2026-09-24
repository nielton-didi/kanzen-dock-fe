import { cn } from "cn"

import { Badge } from "@/components/ui/badge"
import type {
  WorkItemPriority,
  WorkItemSeverity,
  WorkItemType,
  Status,
  StatusCategory,
  StatusColor,
} from "@/lib/types"

export const WORK_ITEM_TYPES: { value: WorkItemType; label: string }[] = [
  { value: "bug", label: "Bug" },
  { value: "task", label: "Task" },
]

export const STATUS_CATEGORIES: { value: StatusCategory; label: string }[] = [
  { value: "not_started", label: "Not Started" },
  { value: "active", label: "Active" },
  { value: "done", label: "Done" },
  { value: "closed", label: "Closed" },
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

export const WORK_ITEM_SEVERITIES: { value: WorkItemSeverity; label: string }[] = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
]

export const WORK_ITEM_PRIORITIES: { value: WorkItemPriority; label: string }[] = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
]

const TYPE_CLASSNAMES: Record<WorkItemType, string> = {
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

const SEVERITY_CLASSNAMES: Record<WorkItemSeverity, string> = {
  critical: "bg-red-500/10 text-red-600 dark:text-red-400",
  high: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  low: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
}

const PRIORITY_CLASSNAMES: Record<WorkItemPriority, string> = {
  high: "bg-red-500/10 text-red-600 dark:text-red-400",
  medium: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  low: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
}

const TYPE_LABELS = Object.fromEntries(
  WORK_ITEM_TYPES.map((t) => [t.value, t.label])
) as Record<WorkItemType, string>
const SEVERITY_LABELS = Object.fromEntries(
  WORK_ITEM_SEVERITIES.map((s) => [s.value, s.label])
) as Record<WorkItemSeverity, string>
const PRIORITY_LABELS = Object.fromEntries(
  WORK_ITEM_PRIORITIES.map((p) => [p.value, p.label])
) as Record<WorkItemPriority, string>

export function WorkItemTypeBadge({
  type,
  className,
}: {
  type: WorkItemType
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

export function WorkItemStatusBadge({
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

export function WorkItemSeverityBadge({
  severity,
  className,
}: {
  severity: WorkItemSeverity | null
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

export function WorkItemPriorityBadge({
  priority,
  className,
}: {
  priority: WorkItemPriority
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
