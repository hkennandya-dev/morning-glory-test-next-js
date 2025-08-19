"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "./separator"
import { toZonedTime } from "date-fns-tz"
// import { Portal } from "@radix-ui/react-popover"
import { id } from "date-fns/locale"

export function DatePicker({
  date,
  setDate,
  placeholder,
  className,
  disabled,
  readOnly,
}: {
  date: Date | undefined | null
  setDate: (date: Date | undefined | null) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  readOnly?: boolean
}) {
  return (
    <Popover>
      <PopoverTrigger type="button" asChild className="pointer-events-auto">
        <div className="relative w-full">
          <Button
            type="button"
            aria-readonly={readOnly}
            disabled={disabled}
            variant={"outline"}
            className={cn(
              "pointer-events-auto pl-3 w-full justify-between text-left font-normal dark:bg-transparent",
              !date && "text-muted-foreground",
              className, (disabled || readOnly) && "read-only:opacity-75 read-only:cursor-default disabled:opacity-50 read-only:hover:!bg-inherit disabled:hover:!bg-inherit"
            )}
          >
            {date ? (
              format(date, "EEEE, dd MMMM yyyy", { locale: id })
            ) : (
              <span>{placeholder || "Select a date"}</span>
            )}
          </Button>
          <div className="space-x-2 flex items-center absolute right-3 top-1/2 -translate-y-1/2">
            {date && (!disabled && !readOnly) && (
              <>
                <button
                  type="button"
                  className="cursor-pointer hover:text-foreground text-muted-foreground opacity-50 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation()
                    setDate(null)
                  }}
                >
                  <X className="h-4 w-4" />
                </button>
                <Separator orientation="vertical" className="min-h-4 w-px" />
              </>
            )}
            <CalendarIcon className="h-4 w-4 text-muted-foreground opacity-50" />
          </div>
        </div>
      </PopoverTrigger>
      {!disabled && !readOnly &&
        // <Portal>
          <PopoverContent side="top" className="origin-top w-auto p-0 pointer-events-auto data-[side=top]:slide-in-from-bottom-2 data-[side=top]:slide-in-from-right-0 slide-in-from-bottom-2 slide-in-from-right-0">
            <Calendar
              mode="single"
              selected={date || undefined}
              onSelect={(selected) => {
                if (selected) {
                  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                  const rawDate = new Date(selected);
                  const zonedDate = toZonedTime(rawDate, timeZone);
                  setDate(zonedDate || undefined);
                } else {
                  setDate(undefined);
                }
              }}
              initialFocus
            />
          </PopoverContent>
        // </Portal>
      }
    </Popover>
  )
}
