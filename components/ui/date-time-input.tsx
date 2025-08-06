import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { TimePicker } from "@/components/ui/time-picker"
import { formatDate } from "@/lib/utils"
import { CalendarIcon } from "lucide-react"

interface DateTimeInputProps {
    date?: Date
    onDateChange: (date: Date | undefined) => void
    showTime?: boolean
}

export function DateTimeInput({ date, onDateChange, showTime = false }: DateTimeInputProps) {
    const handleDateSelection = (selectedDate: Date | undefined) => {
        if (!selectedDate) {
            onDateChange(undefined)
            return
        }

        // If there's an existing date with time, preserve the time
        if (date) {
            selectedDate.setHours(date.getHours(), date.getMinutes(), date.getSeconds())
        }

        onDateChange(selectedDate)
    }

    return (
        <div className="flex flex-col space-y-2">
            <div>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={`w-full justify-start text-left font-normal ${!date && "text-muted-foreground"}`}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? formatDate(date) : "Select a date"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={handleDateSelection}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>

            {showTime && date && (
                <div>
                    <Label className="text-sm font-medium mb-1 block">Time</Label>
                    <TimePicker
                        date={date}
                        setDate={(newDate: Date) => onDateChange(newDate)}
                    />
                </div>
            )}
        </div>
    )
}
