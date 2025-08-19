import * as React from "react"

import { cn } from "@/lib/utils"
import { Input } from "./input"
import { Clock } from "lucide-react"

interface TimePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  parentClassName?: string;
}

function TimePicker({ parentClassName, className, ...props }: TimePickerProps) {
  return (
    <div className={`relative ${parentClassName ?? ""}`}>
      <Input
        type="time"
        className={cn("bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none", className)}
        {...props}
      />
      <Clock className="absolute top-1/2 -translate-1/2 right-1 h-4 w-4 text-muted-foreground opacity-50" />
    </div>
  )
}

export { TimePicker }
