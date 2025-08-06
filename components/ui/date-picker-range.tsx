"use client"

import * as React from "react"
import { format, setHours, setMinutes } from "date-fns"
import { Calendar as CalendarIcon, Clock } from "lucide-react"
import { DateRange } from "react-day-picker"
import { fr } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Calendar } from "./calendar"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Close as PopoverClose } from "@radix-ui/react-popover"
import { Separator } from "@/components/ui/separator"
import { Label } from "./label"
import { Input } from "./input"

type DatePickerRangeProps = React.HTMLAttributes<HTMLDivElement> & {
    date: DateRange | undefined
    setDate: (date: DateRange | undefined) => void
    preSelectedRanges?: PreSelectedRangesType
    textHolder?: string
    validButton?: boolean
    includeTime?: boolean
    hoursText?: {
        label: string
        from: string
        to: string
    }
    predefinedText?: {
        label: string
    }
}

export type PreSelectedRangesType = {
    label: string
    dateRange: DateRange
}[]

export function DatePickerRange({
    className,
    date,
    setDate,
    preSelectedRanges,
    textHolder,
    validButton,
    includeTime = false,
    hoursText = {
        label: "Hours",
        from: "From",
        to: "To",
    },
    predefinedText = {
        label: "Predefined Ranges",
    },
}: DatePickerRangeProps) {
    const [fromHour, setFromHour] = React.useState("00")
    const [fromMinute, setFromMinute] = React.useState("00")
    const [toHour, setToHour] = React.useState("23")
    const [toMinute, setToMinute] = React.useState("59")

    // Mettre à jour l'heure dans la date
    const updateTimeInDate = () => {
        if (!date) return

        const newRange: DateRange = {
            from: date.from
                ? setMinutes(setHours(date.from, parseInt(fromHour) || 0), parseInt(fromMinute) || 0)
                : undefined,
            to: date.to
                ? setMinutes(setHours(date.to, parseInt(toHour) || 23), parseInt(toMinute) || 59)
                : undefined,
        }

        setDate(newRange)
    }

    // Valider et formater l'entrée d'heure
    const validateHourInput = (value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
        const numValue = parseInt(value) || 0
        if (numValue < 0) {
            setter("00")
        } else if (numValue > 23) {
            setter("23")
        } else {
            setter(numValue.toString().padStart(2, "0"))
        }
    }

    // Valider et formater l'entrée de minute
    const validateMinuteInput = (value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
        const numValue = parseInt(value) || 0
        if (numValue < 0) {
            setter("00")
        } else if (numValue > 59) {
            setter("59")
        } else {
            setter(numValue.toString().padStart(2, "0"))
        }
    }

    // Formater l'affichage de la date avec l'heure si includeTime est true
    const formatDateDisplay = (dateValue: Date, isTo = false) => {
        if (!includeTime) {
            return format(dateValue, "LLL dd, y", { locale: fr })
        }

        const h = isTo ? toHour : fromHour
        const m = isTo ? toMinute : fromMinute
        return format(dateValue, "LLL dd, y") + ` ${h}:${m}`
    }

    // Initialiser les heures et minutes lors du changement de date
    React.useEffect(() => {
        if (date?.from) {
            setFromHour(date.from.getHours().toString().padStart(2, "0"))
            setFromMinute(date.from.getMinutes().toString().padStart(2, "0"))
        }
        if (date?.to) {
            setToHour(date.to.getHours().toString().padStart(2, "0"))
            setToMinute(date.to.getMinutes().toString().padStart(2, "0"))
        }
    }, [date?.from, date?.to])

    return (
        <div className="grid">
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-[300px] justify-start text-left font-normal",
                            !date && "text-muted-foreground",
                            className,
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {formatDateDisplay(date.from)} - {formatDateDisplay(date.to, true)}
                                </>
                            ) : (
                                formatDateDisplay(date.from)
                            )
                        ) : (
                            <span>{textHolder ?? "Choisir une période"}</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-auto p-0"
                    align="start"
                >
                    <div className="flex">
                        <div>
                            <Calendar
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={setDate}
                                captionLayout={"dropdown"}
                                className={"h-[365px] w-[300px] flex justify-center"}
                                locale={fr}
                            />
                            {includeTime && (
                                <div className="px-2 pb-1 flex justify-center ">
                                    <div className="flex flex-col space-y-2">
                                        <div className="flex items-center">
                                            <Clock className="mr-2 h-4 w-4" />
                                            <span className="text-sm font-medium">Heures</span>
                                        </div>
                                        <Separator />
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label
                                                    htmlFor="fromTime"
                                                    className="text-xs mb-1 block"
                                                >
                                                    {hoursText.from}
                                                </Label>
                                                <div className="flex items-center space-x-1">
                                                    <Input
                                                        id="fromHour"
                                                        type="number"
                                                        min={0}
                                                        max={23}
                                                        value={fromHour}
                                                        onChange={(e) => {
                                                            setFromHour(e.target.value)
                                                        }}
                                                        onBlur={(e) => {
                                                            validateHourInput(e.target.value, setFromHour)
                                                            updateTimeInDate()
                                                        }}
                                                        className="w-14 px-2 text-center"
                                                    />
                                                    <span>:</span>
                                                    <Input
                                                        id="fromMinute"
                                                        type="number"
                                                        min={0}
                                                        max={59}
                                                        value={fromMinute}
                                                        onChange={(e) => {
                                                            setFromMinute(e.target.value)
                                                        }}
                                                        onBlur={(e) => {
                                                            validateMinuteInput(e.target.value, setFromMinute)
                                                            updateTimeInDate()
                                                        }}
                                                        className="w-14 px-2 text-center"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <Label
                                                    htmlFor="toTime"
                                                    className="text-xs mb-1 block"
                                                >
                                                    {hoursText.to}
                                                </Label>
                                                <div className="flex items-center space-x-1">
                                                    <Input
                                                        id="toHour"
                                                        type="number"
                                                        min={0}
                                                        max={23}
                                                        value={toHour}
                                                        onChange={(e) => {
                                                            setToHour(e.target.value)
                                                        }}
                                                        onBlur={(e) => {
                                                            validateHourInput(e.target.value, setToHour)
                                                            updateTimeInDate()
                                                        }}
                                                        className="w-14 px-2 text-center"
                                                    />
                                                    <span>:</span>
                                                    <Input
                                                        id="toMinute"
                                                        type="number"
                                                        min={0}
                                                        max={59}
                                                        value={toMinute}
                                                        onChange={(e) => {
                                                            setToMinute(e.target.value)
                                                        }}
                                                        onBlur={(e) => {
                                                            validateMinuteInput(e.target.value, setToMinute)
                                                            updateTimeInDate()
                                                        }}
                                                        className="w-14 px-2 text-center"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {!preSelectedRanges?.length && validButton && (
                                <PopoverClose className={"w-full p-3 pt-2"}>
                                    <Button className={"w-full"}>Valider</Button>
                                </PopoverClose>
                            )}
                        </div>

                        {preSelectedRanges?.length && (
                            <div className={"flex border-l flex-col justify-between"}>
                                <div className="p-3 flex flex-col space-y-1">
                                    <h3 className="text-sm font-medium text-center">{predefinedText.label}</h3>
                                    <Separator />
                                    {preSelectedRanges.map((range, index) => (
                                        <Button
                                            key={index}
                                            variant="outline"
                                            onClick={() => setDate(range.dateRange)}
                                        >
                                            {range.label}
                                        </Button>
                                    ))}
                                </div>
                                {validButton && (
                                    <PopoverClose className={"w-full p-3 pt-0"}>
                                        <Button className={"w-full"}>Valider</Button>
                                    </PopoverClose>
                                )}
                            </div>
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}
