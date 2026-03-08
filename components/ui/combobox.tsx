"use client"

import { Check, ChevronsUpDown } from "lucide-react"
import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export type ComboboxOption = {
    value: string
    label: string
}

interface ComboboxProps {
    options: ComboboxOption[]
    value: string | string[]
    onChange: (value: string | string[]) => void
    placeholder?: string
    emptyMessage?: string
    className?: string
    disabled?: boolean
    multiple?: boolean
}

export function Combobox({
    options,
    value,
    onChange,
    placeholder = "Select an option",
    emptyMessage = "No option found.",
    className,
    disabled = false,
    multiple = false,
}: ComboboxProps) {
    const [open, setOpen] = React.useState(false)
    const maxVisibleBadges = 2

    // If multiple is true, ensure value is an array
    const values = multiple
        ? Array.isArray(value)
            ? value
            : []
        : (typeof value === "string" ? [value] : []).filter(Boolean)

    // Get the selected options for display
    const selectedOptions = options.filter((option) => values.includes(option.value))
    const visibleSelectedOptions = selectedOptions.slice(0, maxVisibleBadges)
    const hiddenSelectedCount = selectedOptions.length - visibleSelectedOptions.length

    // Handle the selection of an option
    const handleSelect = (optionValue: string) => {
        if (multiple) {
            const newValues = [...values]
            const index = newValues.indexOf(optionValue)

            if (index === -1) {
                newValues.push(optionValue)
            } else {
                newValues.splice(index, 1)
            }

            onChange(newValues)
        } else {
            onChange(typeof value === "string" && optionValue === value ? "" : optionValue)
        }

        if (!multiple) {
            setOpen(false)
        }
    }

    // Remove a selected item (for multiple select)
    const removeItem = (optionValue: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (multiple) {
            const newValues = values.filter((v) => v !== optionValue)
            onChange(newValues)
        }
    }

    return (
        <Popover
            open={open}
            onOpenChange={setOpen}
        >
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "h-10 w-full justify-between",
                        className,
                    )}
                    disabled={disabled}
                >
                    <div className="flex min-w-0 items-center gap-1 overflow-hidden">
                        {multiple ? (
                            values.length > 0 ? (
                                <div className="flex min-w-0 items-center gap-1 overflow-hidden">
                                    {visibleSelectedOptions.map((option) => (
                                        <Badge
                                            variant="secondary"
                                            key={option.value}
                                            className="inline-flex max-w-[140px] items-center gap-1 truncate"
                                        >
                                            <span className="truncate">{option.label}</span>
                                        </Badge>
                                    ))}
                                    {hiddenSelectedCount > 0 ? (
                                        <Badge
                                            variant="secondary"
                                            className="shrink-0"
                                        >
                                            ...
                                        </Badge>
                                    ) : null}
                                </div>
                            ) : (
                                <span className="text-muted-foreground">{placeholder}</span>
                            )
                        ) : selectedOptions.length > 0 ? (
                            selectedOptions[0].label
                        ) : (
                            placeholder
                        )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
                <Command>
                    <CommandInput
                        placeholder={placeholder}
                        className="h-9"
                    />
                    <CommandEmpty>{emptyMessage}</CommandEmpty>
                    <CommandGroup>
                        {options.map((option) => (
                            <CommandItem
                                key={option.value}
                                value={option.value}
                                onSelect={() => handleSelect(option.value)}
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        values.includes(option.value) ? "opacity-100" : "opacity-0",
                                    )}
                                />
                                {option.label}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
