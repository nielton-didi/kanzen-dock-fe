import {
  Minus,
  OctagonAlert,
  SignalHigh,
  SignalLow,
  SignalMedium,
  type LucideIcon,
} from "lucide-react"
import { cn } from "cn"

import { Badge } from "@/components/ui/badge"
import type {
  WorkItemPriority,
  Status,
  StatusCategory,
  StatusColor,
} from "@/lib/types"

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

export const WORK_ITEM_PRIORITIES: { value: WorkItemPriority; label: string }[] = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
  { value: "none", label: "No priority" },
]

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

// Priority is shown as an icon, colored only where it signals risk (§3.4).
const PRIORITY_ICONS: Record<WorkItemPriority, { icon: LucideIcon; className: string }> = {
  urgent: { icon: OctagonAlert, className: "text-danger" },
  high: { icon: SignalHigh, className: "text-warning" },
  medium: { icon: SignalMedium, className: "text-muted-foreground" },
  low: { icon: SignalLow, className: "text-muted-foreground" },
  none: { icon: Minus, className: "text-subtle-foreground" },
}

const PRIORITY_LABELS = Object.fromEntries(
  WORK_ITEM_PRIORITIES.map((p) => [p.value, p.label])
) as Record<WorkItemPriority, string>

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

export function WorkItemPriorityIcon({
  priority,
  className,
}: {
  priority: WorkItemPriority
  className?: string
}) {
  const { icon: Icon, className: colorClassName } = PRIORITY_ICONS[priority]
  return <Icon className={cn("size-3.5 shrink-0", colorClassName, className)} />
}

/** Icon + label. With `compact`, "No priority" shows just the dash (label kept for screen readers). */
export function WorkItemPriorityLabel({
  priority,
  compact,
  className,
}: {
  priority: WorkItemPriority
  compact?: boolean
  className?: string
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <WorkItemPriorityIcon priority={priority} />
      <span
        className={cn(
          priority === "none" && "text-subtle-foreground",
          compact && priority === "none" && "sr-only"
        )}
      >
        {PRIORITY_LABELS[priority]}
      </span>
    </span>
  )
}

/** Menu options with the priority icon next to each label. */
export const WORK_ITEM_PRIORITY_OPTIONS = WORK_ITEM_PRIORITIES.map((p) => ({
  value: p.value,
  label: <WorkItemPriorityLabel priority={p.value} />,
}))
