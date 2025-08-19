import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground read-only:opacity-75 read-only:cursor-default read-only:focus-visible:ring-0 read-only:focus-visible:border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-transparent flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 transition-[color] outline-none focus-visible:ring-[2px] disabled:cursor-not-allowed disabled:opacity-50 text-xs sm:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
