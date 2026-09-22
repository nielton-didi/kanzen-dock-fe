import { cn } from "cn"

import { Badge } from "@/components/ui/badge"
import type { IssuePriority, IssueSeverity, IssueStatus } from "@/lib/types"

export const ISSUE_STATUSES: { value: IssueStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
  { value: "wont_fix", label: "Won't Fix" },
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

const STATUS_CLASSNAMES: Record<IssueStatus, string> = {
  open: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  in_progress: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  resolved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  closed: "bg-muted text-muted-foreground",
  wont_fix: "bg-muted text-muted-foreground line-through",
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

const STATUS_LABELS = Object.fromEntries(
  ISSUE_STATUSES.map((s) => [s.value, s.label])
) as Record<IssueStatus, string>
const SEVERITY_LABELS = Object.fromEntries(
  ISSUE_SEVERITIES.map((s) => [s.value, s.label])
) as Record<IssueSeverity, string>
const PRIORITY_LABELS = Object.fromEntries(
  ISSUE_PRIORITIES.map((p) => [p.value, p.label])
) as Record<IssuePriority, string>

export function IssueStatusBadge({
  status,
  className,
}: {
  status: IssueStatus
  className?: string
}) {
  return (
    <Badge
      variant="outline"
      className={cn("border-transparent", STATUS_CLASSNAMES[status], className)}
    >
      {STATUS_LABELS[status]}
    </Badge>
  )
}

export function IssueSeverityBadge({
  severity,
  className,
}: {
  severity: IssueSeverity
  className?: string
}) {
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
