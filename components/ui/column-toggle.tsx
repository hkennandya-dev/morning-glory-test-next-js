"use client"

import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu"
import { Table } from "@tanstack/react-table"
import { ChevronDownIcon, Settings2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContentWithoutPortal,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>
  showValue?: boolean
  buttonClassName?: string
  buttonSize?: "default" | "sm" | "lg" | "icon"
}

export function DataTableViewOptions<TData>({
  table, showValue = false, buttonClassName, buttonSize = "sm"
}: DataTableViewOptionsProps<TData>) {
  const [open, setOpen] = useState(false);
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          onClick={() => setOpen(true)}
          variant="outline"
          size={buttonSize}
          className={cn("dark:bg-transparent h-full lg:flex hover:bg-inherit", buttonClassName)}
        >
          {showValue ?
            <div className="w-full flex justify-start items-center gap-2">
              <Settings2 className="text-muted-foreground" />
              <span className="text-xs sm:text-sm text-foreground font-normal">
                {showValue && `${table.getVisibleFlatColumns().length} Selected`}
              </span>
            </div>
            :
            <Settings2 className="text-muted-foreground" />
          }
          <ChevronDownIcon className="size-4 text-muted-foreground opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContentWithoutPortal
        onInteractOutside={(e) => {
          e.preventDefault();
          setTimeout(() => setOpen(false), 0);
        }}
        side="bottom" align="end" className={cn("min-w-[var(--radix-dropdown-menu-trigger-width)] max-w-[450px] text-left origin-bottom w-auto pointer-events-auto data-[side=bottom]:slide-in-from-bottom-2 data-[side=bottom]:slide-in-from-right-0 slide-in-from-bottom-2 slide-in-from-right-0 p-1 z-60")}>
        <DropdownMenuLabel className="text-muted-foreground px-2 py-2 text-xs sm:text-xs font-normal">Visibilitas Kolom</DropdownMenuLabel>
        {table
          .getAllColumns()
          .filter(
            (column) =>
              typeof column.accessorFn !== "undefined" && column.getCanHide()
          )
          .map((column) => {
            const value = column.getIsVisible();
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="cursor-pointer z-60 relative pointer-events-auto"
                checked={value}
                onSelect={() => {
                  setTimeout(() => column.toggleVisibility(!value), 0);
                }}
              >
                {typeof column.id === "string"
                  ? column.id.split("%")[0]
                  : String(column.id)}
              </DropdownMenuCheckboxItem>
            )
          })}
      </DropdownMenuContentWithoutPortal>
    </DropdownMenu>
  )
}