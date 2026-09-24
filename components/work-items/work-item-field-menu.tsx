"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"

/** Wraps a badge/avatar trigger with a checklist dropdown of value options,
 * for the "click a cell, pick a new value" editing pattern used across the
 * work item row's Status/Priority/Assignee columns. */
export function WorkItemFieldMenu({
  value,
  options,
  disabled,
  onValueChange,
  children,
}: {
  value: string
  options: { value: string; label: React.ReactNode }[]
  disabled?: boolean
  onValueChange: (value: string) => void
  children: React.ReactNode
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            disabled={disabled}
            onClick={(event) => event.stopPropagation()}
            className="flex w-fit items-center justify-self-center rounded-md outline-none disabled:pointer-events-none hover:opacity-80 focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        }
      >
        {disabled ? <Spinner className="size-3.5 text-muted-foreground" /> : children}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-40"
        onClick={(event) => event.stopPropagation()}
      >
        <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value} closeOnClick>
              <span className="truncate">{option.label}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
