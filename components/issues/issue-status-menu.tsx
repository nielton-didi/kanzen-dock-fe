"use client"

import { cn } from "cn"

import { STATUS_CATEGORIES, STATUS_SWATCH_CLASSNAMES } from "@/components/issues/issue-badges"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import type { Status } from "@/lib/types"

export function IssueStatusMenu({
  status,
  statuses,
  disabled,
  error,
  onValueChange,
  triggerClassName,
  children,
}: {
  status: Status
  statuses: Status[]
  disabled?: boolean
  error?: string | null
  onValueChange: (statusId: string) => void
  triggerClassName?: string
  children: React.ReactNode
}) {
  const groups = STATUS_CATEGORIES.map((category) => ({
    ...category,
    items: statuses.filter((s) => s.category === category.value),
  })).filter((group) => group.items.length > 0)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            disabled={disabled}
            title={error ?? `Status: ${status.name}`}
            onClick={(event) => event.stopPropagation()}
            className={cn(
              "flex w-fit items-center justify-self-center outline-none disabled:pointer-events-none",
              triggerClassName
            )}
          />
        }
      >
        {disabled ? <Spinner className="size-3.5 text-muted-foreground" /> : children}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-48"
        onClick={(event) => event.stopPropagation()}
      >
        <DropdownMenuRadioGroup value={status.id} onValueChange={onValueChange}>
          {groups.map((group, index) => (
            <div key={group.value}>
              {index > 0 && <DropdownMenuSeparator />}
              <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
              {group.items.map((s) => (
                <DropdownMenuRadioItem key={s.id} value={s.id} closeOnClick>
                  <span
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      STATUS_SWATCH_CLASSNAMES[s.color]
                    )}
                  />
                  <span className="truncate">{s.name}</span>
                </DropdownMenuRadioItem>
              ))}
            </div>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
