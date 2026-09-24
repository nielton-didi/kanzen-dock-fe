"use client"

import { cn } from "cn"

import {
  STATUS_COLORS,
  STATUS_SWATCH_CLASSNAMES,
} from "@/components/work-items/work-item-badges"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { StatusColor } from "@/lib/types"

export function StatusColorPicker({
  value,
  onChange,
}: {
  value: StatusColor
  onChange: (color: StatusColor) => void
}) {
  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "size-5 shrink-0 rounded-full ring-1 ring-foreground/10 transition-transform hover:scale-110",
          STATUS_SWATCH_CLASSNAMES[value]
        )}
      >
        <span className="sr-only">Change color</span>
      </PopoverTrigger>
      <PopoverContent className="w-auto">
        <div className="grid grid-cols-5 gap-1.5">
          {STATUS_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onChange(color)}
              className={cn(
                "size-6 rounded-full ring-1 ring-foreground/10 transition-transform hover:scale-110",
                STATUS_SWATCH_CLASSNAMES[color],
                color === value && "ring-2 ring-offset-2 ring-offset-popover ring-foreground"
              )}
            >
              <span className="sr-only">{color}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
