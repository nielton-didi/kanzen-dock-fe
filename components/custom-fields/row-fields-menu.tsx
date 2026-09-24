"use client"

import { ChevronDownIcon, Columns3 } from "lucide-react"

import { FieldKindIcon } from "@/components/custom-fields/custom-field-display"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MAX_ROW_FIELDS, type FieldDefinition } from "@/lib/types"

/**
 * Picks which custom fields show as columns in this list's rows, for the
 * current user only. Columns appear in the order they were picked.
 */
export function RowFieldsMenu({
  fields,
  value,
  onValueChange,
}: {
  fields: FieldDefinition[]
  value: string[]
  onValueChange: (value: string[]) => void
}) {
  if (fields.length === 0) return null

  const full = value.length >= MAX_ROW_FIELDS

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="sm" className="text-muted-foreground" />
        }
      >
        <Columns3 />
        Columns
        {value.length > 0 && <span className="text-subtle-foreground">{value.length}</span>}
        <ChevronDownIcon className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            Show in rows (up to {MAX_ROW_FIELDS}) · only you
          </DropdownMenuLabel>
          {fields.map((field) => {
            const checked = value.includes(field.id)
            return (
              <DropdownMenuCheckboxItem
                key={field.id}
                checked={checked}
                disabled={!checked && full}
                closeOnClick={false}
                onCheckedChange={(next) =>
                  onValueChange(
                    next ? [...value, field.id] : value.filter((id) => id !== field.id)
                  )
                }
              >
                <FieldKindIcon kind={field.kind} className="text-muted-foreground" />
                <span className="truncate">{field.name}</span>
              </DropdownMenuCheckboxItem>
            )
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
