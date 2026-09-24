import { differenceInCalendarDays, format } from "date-fns"

/** A calendar day as `YYYY-MM-DD` — how start/due dates travel to and from the
 * API. Keeping days as strings (not `Date`s) avoids timezone shifts: the
 * backend stores a plain `date`, and "Oct 15" must read as Oct 15 everywhere. */
export type DayKey = string

/** API value (`2026-10-15T00:00:00.000Z` or `2026-10-15`) -> day key. */
export function toDayKey(value: string): DayKey {
  return value.slice(0, 10)
}

/** Day key -> local-midnight `Date`, for date pickers and formatting. */
export function dayKeyToDate(key: DayKey): Date {
  const [year, month, day] = key.split("-").map(Number)
  return new Date(year, month - 1, day)
}

/** Local `Date` (e.g. picked in a calendar) -> day key. */
export function dateToDayKey(date: Date): DayKey {
  return format(date, "yyyy-MM-dd")
}

export function todayKey(): DayKey {
  return dateToDayKey(new Date())
}

/** "Oct 15", or "Oct 15, 2027" outside the current year. */
export function formatDay(key: DayKey): string {
  const date = dayKeyToDate(key)
  const sameYear = date.getFullYear() === new Date().getFullYear()
  return format(date, sameYear ? "MMM d" : "MMM d, yyyy")
}

export type DueState = "overdue" | "soon" | "later"

/** Overdue = before today; soon = today or tomorrow (design-guidelines §3.4). */
export function dueState(dueKey: DayKey): DueState {
  const days = differenceInCalendarDays(dayKeyToDate(dueKey), new Date())
  if (days < 0) return "overdue"
  if (days <= 1) return "soon"
  return "later"
}
