"use client"

import { ChevronDownIcon } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function FilterDropdown({
  icon,
  label,
  value,
  options,
  onValueChange,
}: {
  icon: React.ReactNode
  label: string
  value: string[]
  options: { value: string; label: string }[]
  onValueChange: (value: string[]) => void
}) {
  const selectedLabels = options
    .filter((option) => value.includes(option.value))
    .map((option) => option.label)

  const summary =
    selectedLabels.length === 0
      ? "All"
      : selectedLabels.length === 1
        ? selectedLabels[0]
        : `${selectedLabels.length} selected`

  function toggle(optionValue: string, checked: boolean) {
    onValueChange(
      checked ? [...value, optionValue] : value.filter((v) => v !== optionValue)
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex h-7 items-center gap-1.5 rounded-[min(var(--radius-md),12px)] border border-input bg-transparent px-2.5 text-[0.8rem] whitespace-nowrap outline-none select-none hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:bg-muted dark:bg-input/30 dark:hover:bg-input/50"
          />
        }
      >
        {icon}
        <span className="text-muted-foreground">{label}:</span>
        <span className="font-medium">{summary}</span>
        <ChevronDownIcon className="size-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={value.includes(option.value)}
            onCheckedChange={(checked) => toggle(option.value, checked)}
          >
            <span className="truncate">{option.label}</span>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
