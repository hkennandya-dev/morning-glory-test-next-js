import { Column } from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ChevronsUpDown, EyeOff, FolderCog } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuContentWithoutPortal,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "./badge"
import Link from "next/link"
import { useState } from "react"

interface DataTableColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>
  title: string | React.ReactNode
  manage?: string
  className?: string
  label?: {
    asc: string
    desc: string
  }
  badge?: {
    asc: string
    desc: string
  }
  flip?: boolean,
  portal?: boolean
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
  label,
  manage,
  flip = false,
  badge,
  portal = true
}: DataTableColumnHeaderProps<TData, TValue>) {
  const [open, setOpen] = useState(false);
  const MenuContent = portal ? DropdownMenuContent : DropdownMenuContentWithoutPortal;
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            onClick={() => setOpen(true)}
            variant="ghost"
            size="sm"
            className="text-xs sm:text-sm group/button -ml-3 h-8 hover:!bg-transparent focus-visible:ring-0"
          >
            <span>{title}</span>
            <div className="opacity-50 group-hover/button:opacity-100">
              {column.getIsSorted() === "desc" ?
                flip ? <ArrowUp /> : <ArrowDown />
                : column.getIsSorted() === "asc" ?
                  flip ? <ArrowDown /> : <ArrowUp />
                  : column.getCanSort() ?
                    <ChevronsUpDown />
                    : <></>
              }
            </div>
          </Button>
        </DropdownMenuTrigger>
        <MenuContent
          onInteractOutside={(e) => { setOpen(false); e.preventDefault() }}
          side={portal ? undefined : "bottom"} align="start" className={cn("min-w-[var(--radix-dropdown-menu-trigger-width)] max-w-[450px]", portal ? "" : "text-left origin-bottom w-auto pointer-events-auto data-[side=bottom]:slide-in-from-bottom-2 data-[side=bottom]:slide-in-from-right-0 slide-in-from-bottom-2 slide-in-from-right-0 p-1")}>
          {column.getCanSort() && (
            <>
              <DropdownMenuItem className="cursor-pointer" onClick={() => flip ? column.toggleSorting(true) : column.toggleSorting(false)}>
                <span>{label ? label.asc : 'Teratas'}</span><Badge variant="outline">{badge ? badge.asc : 'A - Z'}</Badge>
                <DropdownMenuShortcut><ArrowUp /></DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => flip ? column.toggleSorting(false) : column.toggleSorting(true)}>
                <span>{label ? label.desc : 'Terbawah'}</span><Badge variant="outline">{badge ? badge.desc : 'Z - A'}</Badge>
                <DropdownMenuShortcut><ArrowDown /></DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {manage &&
            <Link href={manage}>
              <DropdownMenuItem className="cursor-pointer">
                Manage
                <DropdownMenuShortcut><FolderCog /></DropdownMenuShortcut>
              </DropdownMenuItem>
            </Link>
          }
          <DropdownMenuItem className="cursor-pointer" onClick={() => column.toggleVisibility(false)}>
            Sembunyikan
            <DropdownMenuShortcut><EyeOff /></DropdownMenuShortcut>
          </DropdownMenuItem>
        </MenuContent>
      </DropdownMenu>
    </div>
  )
}