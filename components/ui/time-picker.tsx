import React, { useEffect, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock } from "lucide-react"
import { format } from "date-fns"

interface TimePickerProps {
    date: Date
    setDate: (date: Date) => void
}

export function TimePicker({ date, setDate }: TimePickerProps) {
    const [hours, setHours] = useState<string>(format(date, "HH"))
    const [minutes, setMinutes] = useState<string>(format(date, "mm"))

    // Update the hours and minutes when the date prop changes
    useEffect(() => {
        setHours(format(date, "HH"))
        setMinutes(format(date, "mm"))
    }, [date])

    // Handle hour change
    const handleHoursChange = (value: string) => {
        setHours(value)
        const newDate = new Date(date)
        newDate.setHours(parseInt(value, 10))
        setDate(newDate)
    }

    // Handle minute change
    const handleMinutesChange = (value: string) => {
        setMinutes(value)
        const newDate = new Date(date)
        newDate.setMinutes(parseInt(value, 10))
        setDate(newDate)
    }

    // Generate options for hours (00-23)
    const hoursOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"))

    // Generate options for minutes (00-59)
    const minutesOptions = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"))

    return (
        <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div className="flex items-center space-x-1">
                <Select
                    value={hours}
                    onValueChange={handleHoursChange}
                >
                    <SelectTrigger className="w-[70px]">
                        <SelectValue placeholder="HH" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                        {hoursOptions.map((hour) => (
                            <SelectItem
                                key={hour}
                                value={hour}
                            >
                                {hour}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <span className="text-muted-foreground">:</span>
                <Select
                    value={minutes}
                    onValueChange={handleMinutesChange}
                >
                    <SelectTrigger className="w-[70px]">
                        <SelectValue placeholder="MM" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                        {minutesOptions.map((minute) => (
                            <SelectItem
                                key={minute}
                                value={minute}
                            >
                                {minute}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}
