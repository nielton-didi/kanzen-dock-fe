"use client"

import { FieldKindIcon } from "@/components/custom-fields/custom-field-display"
import { FilterDropdown } from "@/components/work-items/filter-dropdown"
import { isFilterableKind, memberLabel } from "@/lib/custom-fields"
import type { FieldDefinition, WorkspaceMember } from "@/lib/types"

/** Selected filter values per field id, sent as repeated `cf=<fieldId>:<value>`. */
export type CustomFieldFilterState = Record<string, string[]>

function filterOptions(field: FieldDefinition, members: WorkspaceMember[]) {
  switch (field.kind) {
    case "dropdown":
    case "multi_select":
      return field.options.map((option) => ({ value: option.id, label: option.label }))
    case "person":
      return members.map((member) => ({ value: member.user_id, label: memberLabel(member) }))
    case "checkbox":
      // `false` also matches items where the box was never checked (unset).
      return [
        { value: "true", label: "Checked" },
        { value: "false", label: "Unchecked" },
      ]
    default:
      return []
  }
}

/** One filter per filterable custom field (dropdown, multi_select, person,
 * checkbox), in the list's field order. */
export function CustomFieldFilters({
  fields,
  members,
  value,
  onValueChange,
}: {
  fields: FieldDefinition[]
  members: WorkspaceMember[]
  value: CustomFieldFilterState
  onValueChange: (value: CustomFieldFilterState) => void
}) {
  return (
    <>
      {fields
        .filter((field) => isFilterableKind(field.kind))
        .map((field) => {
          const options = filterOptions(field, members)
          if (options.length === 0) return null
          return (
            <FilterDropdown
              key={field.id}
              icon={<FieldKindIcon kind={field.kind} className="text-muted-foreground" />}
              label={field.name}
              value={value[field.id] ?? []}
              options={options}
              onValueChange={(next) => {
                const rest = { ...value }
                delete rest[field.id]
                onValueChange(next.length ? { ...rest, [field.id]: next } : rest)
              }}
            />
          )
        })}
    </>
  )
}
