import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useMediaQuery } from '@react-hook/media-query'
import { cn } from "@/lib/utils"

interface SelectOptionType {
  label: string | React.ReactNode
  value?: string
  tooltip?: string | React.ReactNode
}

interface CustomSelectProps {
  options: SelectOptionType[]
  value: string
  disabled?: boolean
  placeholder?: string
  icon?: React.ReactNode
  onChange: (value: string) => void
  onReset?: () => void
  valueQuery?: string
  className?: string
  align?: "center" | "start" | "end"
}

export function CustomSelect({
  options,
  value,
  disabled = false,
  placeholder = "Select",
  icon = <></>,
  onChange,
  onReset,
  valueQuery,
  className,
  align
}: CustomSelectProps) {
  const mediaMatch = useMediaQuery(valueQuery ?? "");
  const showValue = valueQuery ? mediaMatch : true;

  return (
    <Select
      value={value}
      onValueChange={(val) => {
        onReset?.()
        onChange(val)
      }}
      disabled={disabled}
    >
      <SelectTrigger className={cn("relative pl-9", className)}>
        {icon}
        {showValue &&
          <SelectValue placeholder={placeholder} />
        }
      </SelectTrigger>
      <SelectContent align={align}>
        <SelectGroup>
          {options.map((opt, idx) =>
            opt.value ? (
              <SelectItem key={idx} value={opt.value}>
                <div className="flex items-center gap-2">
                  <span>{opt.label}</span>
                  {opt.tooltip && <Badge variant="outline">{opt.tooltip}</Badge>}
                </div>
              </SelectItem>
            ) : (
              <SelectLabel key={idx}>{opt.label}</SelectLabel>
            )
          )}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}