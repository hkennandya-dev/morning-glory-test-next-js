import { useState, useEffect } from "react"
import { DatePicker } from "./date-picker"
import { TimePicker } from "./time-picker"

type DateTimePickerProps = {
    className?: string
    disabled?: boolean
    readOnly?: boolean
    placeholder?: string
    date?: Date | string | null
    setDate: (date: Date | null | undefined) => void
}

export default function DateTimePicker({
    className,
    disabled,
    readOnly,
    placeholder,
    date,
    setDate,
}: DateTimePickerProps) {
    const [time, setTime] = useState("")

    const getValidDate = (input: Date | string | null | undefined): Date | null => {
        if (!input) return null
        if (input instanceof Date) return isNaN(input.getTime()) ? null : input
        const d = new Date(input)
        return isNaN(d.getTime()) ? null : d
    }

    const getTimeString = (d: Date): string => {
        const hours = String(d.getHours()).padStart(2, "0")
        const minutes = String(d.getMinutes()).padStart(2, "0")
        return `${hours}:${minutes}`
    }

    useEffect(() => {
        const validDate = getValidDate(date)
        if (validDate) {
            setTime(getTimeString(validDate))
        } else {
            setTime("")
        }
    }, [date])

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setTime(value)

        const validDate = getValidDate(date)
        if (validDate && value) {
            const [hours, minutes] = value.split(":").map(Number)
            const newDate = new Date(validDate)
            newDate.setHours(hours)
            newDate.setMinutes(minutes)
            newDate.setSeconds(0)
            newDate.setMilliseconds(0)
            setDate(newDate)
        }
    }

    const handleDateChange = (newDate: Date | null | undefined) => {
        if (newDate && time) {
            const [hours, minutes] = time.split(":").map(Number)
            const updatedDate = new Date(newDate)
            updatedDate.setHours(hours)
            updatedDate.setMinutes(minutes)
            updatedDate.setSeconds(0)
            updatedDate.setMilliseconds(0)
            setDate(updatedDate)
        } else {
            setDate(newDate)
        }
    }

    return (
        <div className="flex gap-2 w-full">
            <DatePicker
                className={className}
                disabled={disabled}
                readOnly={readOnly}
                placeholder={placeholder}
                date={getValidDate(date)}
                setDate={handleDateChange}
            />

            <TimePicker
                type="time"
                step="60"
                value={time}
                onChange={handleTimeChange}
                parentClassName="w-1/3"
                className={className}
                disabled={disabled}
                readOnly={readOnly}
                placeholder={placeholder}
                aria-readonly={readOnly}
            />
        </div>
    )
}