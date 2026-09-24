"use client"

import { useState } from "react"
import { CalendarDays } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Spinner } from "@/components/ui/spinner"
import {
  dateToDayKey,
  dayKeyToDate,
  dueState,
  formatDay,
  type DayKey,
  type DueState,
} from "@/lib/dates"

const DUE_STATE_CLASSNAMES: Record<DueState, string> = {
  overdue: "text-danger",
  soon: "text-warning",
  later: "text-muted-foreground",
}

/** Formatted day, colored by due state when `highlightDue` is set (overdue =
 * danger, today/tomorrow = warning; design-guidelines §3.4). */
export function DayText({
  value,
  highlightDue,
  className,
}: {
  value: DayKey
  highlightDue?: boolean
  className?: string
}) {
  const state = highlightDue ? dueState(value) : null
  return (
    <span
      className={cn(state ? DUE_STATE_CLASSNAMES[state] : "text-foreground", className)}
      title={state === "overdue" ? "Overdue" : undefined}
    >
      {formatDay(value)}
    </span>
  )
}

/** Click-to-pick calendar day with a Clear action. `variant="field"` looks like
 * a form input (dialogs); `"inline"` is a quiet text trigger (rows, detail
 * panel). `min`/`max` disable days outside the allowed range, e.g. so a due
 * date can't be picked before the start date. */
export function WorkItemDatePicker({
  value,
  onChange,
  label,
  min,
  max,
  highlightDue,
  disabled,
  loading,
  error,
  variant = "inline",
  placeholder,
  className,
}: {
  value: DayKey | null
  onChange: (value: DayKey | null) => void
  /** Accessible name, e.g. "Due date". */
  label: string
  min?: DayKey | null
  max?: DayKey | null
  highlightDue?: boolean
  disabled?: boolean
  loading?: boolean
  error?: boolean
  variant?: "inline" | "field"
  placeholder?: React.ReactNode
  className?: string
}) {
  const [open, setOpen] = useState(false)

  function pick(next: DayKey | null) {
    setOpen(false)
    if (next !== value) onChange(next)
  }

  const content = loading ? (
    <Spinner className="size-3.5 text-muted-foreground" />
  ) : value ? (
    <DayText value={value} highlightDue={highlightDue} />
  ) : (
    (placeholder ?? <span className="text-subtle-foreground">Set date</span>)
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled || loading}
        aria-label={value ? `${label}: ${formatDay(value)}` : `Set ${label.toLowerCase()}`}
        onClick={(event) => event.stopPropagation()}
        className={cn(
          variant === "field"
            ? "flex h-8 w-full items-center gap-2 rounded-md border border-input bg-transparent px-2.5 text-left text-sm outline-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            : "flex w-fit items-center gap-1.5 rounded-md px-1 py-0.5 text-sm outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
          error && "ring-1 ring-destructive",
          "disabled:pointer-events-none",
          className
        )}
      >
        {variant === "field" && (
          <CalendarDays className="size-3.5 shrink-0 text-muted-foreground" />
        )}
        {content}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto gap-1 p-1"
        onClick={(event) => event.stopPropagation()}
      >
        <Calendar
          mode="single"
          selected={value ? dayKeyToDate(value) : undefined}
          defaultMonth={value ? dayKeyToDate(value) : undefined}
          onSelect={(date) => date && pick(dateToDayKey(date))}
          disabled={[
            ...(min ? [{ before: dayKeyToDate(min) }] : []),
            ...(max ? [{ after: dayKeyToDate(max) }] : []),
          ]}
        />
        {value && (
          <Button
            variant="ghost"
            size="xs"
            className="justify-start text-muted-foreground"
            onClick={() => pick(null)}
          >
            Clear
          </Button>
        )}
      </PopoverContent>
    </Popover>
  )
}
