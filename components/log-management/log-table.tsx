"use client"

import { getLogsAction } from "@/actions/log.action"
import { Button } from "@/components/ui/button"
import { Combobox, ComboboxOption } from "@/components/ui/combobox"
import { Column, DataTable } from "@/components/ui/data-table"
import { DatePickerRange } from "@/components/ui/date-picker-range"
import { LogType } from "@/prisma/generated/enums"
import { LogEntry } from "@/types/log.type"
import { format, subDays } from "date-fns"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { DateRange } from "react-day-picker"
import { Skeleton } from "../ui/skeleton"

export function LogTable({ logs }: { logs: LogEntry[] }) {
    const t = useTranslations("Logs")
    const tCommon = useTranslations("Common")
    const [filterLoading, setFilterLoading] = useState(true)
    const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([])
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 7),
        to: new Date(),
    })
    const [isLoadingData, setIsLoadingData] = useState(false)

    const [filters, setFilters] = useState<{
        logType: string[]
        user: string[]
        entity: string[]
        role: string[]
    }>({
        logType: [],
        user: [],
        entity: [],
        role: [],
    })

    // Définition des colonnes pour la table
    const columns: Column<LogEntry>[] = [
        {
            key: "message",
            header: t("message"),
            cell: (log) => <div className="font-medium">{getLogMessage(log)}</div>,
        },
        {
            key: "user",
            header: t("user"),
            cell: (log) => log.user?.name,
        },
        {
            key: "entity",
            header: t("entity"),
            cell: (log) => log.entity?.name || "-",
        },
        {
            key: "date",
            header: t("date"),
            cell: (log) => formatDate(log.createdAt),
        },
    ]

    // Charger les logs avec les dates sélectionnées
    const loadLogs = async () => {
        if (!dateRange?.from) return

        setIsLoadingData(true)
        try {
            let result = await getLogsAction({
                startDate: dateRange.from.toISOString(),
                endDate: (dateRange.to || dateRange.from).toISOString(),
            })

            if (result?.serverError) {
                console.error("Server error:", result.serverError)
                result.data = []
            } else if (result?.validationErrors) {
                console.error("Validation errors:", result.validationErrors)
                result.data = []
            } else if (!result?.data) {
                console.error("No data returned from server")
                result = { data: [] }
            }

            setFilteredLogs(result.data as LogEntry[])
            setIsLoadingData(false)
            setFilterLoading(false)
        } catch (error) {
            console.error("Error loading logs:", error)
            setIsLoadingData(false)
        }
    }

    // Charger les logs au changement de dates
    useEffect(() => {
        if (dateRange?.from) {
            loadLogs()
        }
    }, [dateRange])

    // Charger les logs initiaux
    useEffect(() => {
        if (logs.length > 0) {
            setFilteredLogs(logs)
            setFilterLoading(false)
        }
    }, [logs])

    // Get log types for filter
    const logTypes = Object.values(LogType).map((type) => ({
        value: type,
        label: t("label." + type),
    }))

    // Extract users, entities, roles, etc. for filters
    const getFilterOptions = (logs: LogEntry[], key: string): ComboboxOption[] => {
        const uniqueItems = new Map<string, string>()

        logs.forEach((log) => {
            if (key === "user" && log.user) {
                uniqueItems.set(log.user.id, log.user.name)
            } else if (key === "entity" && log.entity) {
                uniqueItems.set(log.entity.id, log.entity.name)
            } else if (key === "role" && log.type.includes("role_") && log.info?.role) {
                uniqueItems.set(log.info.role.id, log.info.role.name)
            }
        })

        return Array.from(uniqueItems).map(([id, name]) => ({
            value: id,
            label: name,
        }))
    }

    // Apply filters when they change
    useEffect(() => {
        setFilterLoading(true)

        let result = [...filteredLogs]

        if (filters.logType.length > 0) {
            result = result.filter((log) => filters.logType.includes(log.type))
        }

        if (filters.user.length > 0) {
            result = result.filter((log) => log.user && filters.user.includes(log.user.id))
        }

        if (filters.entity.length > 0) {
            result = result.filter((log) => log.entity && filters.entity.includes(log.entity.id))
        }

        if (filters.role.length > 0) {
            result = result.filter(
                (log) => log.type.includes("role_") && log.info?.role && filters.role.includes(log.info.role.id),
            )
        }

        setFilteredLogs(result)
        setFilterLoading(false)
    }, [filters])

    // Handle filter change
    const handleFilterChange = (key: string, value: string | string[]) => {
        setFilters((prev) => ({ ...prev, [key]: value }))
    }

    // Reset all filters
    const resetFilters = () => {
        setFilters({
            logType: [],
            user: [],
            entity: [],
            role: [],
        })
    }

    // Format date based on locale
    const formatDate = (date: Date) => {
        return format(new Date(date), "dd/MM/yyyy HH:mm:ss")
    }

    // Get the translated log message
    const getLogMessage = (log: LogEntry) => {
        const type = log.type

        if (!type || !t.has(type)) {
            return type.replace(/_/g, " ")
        }

        let name = ""

        if (type.startsWith("user_") && log.info?.user) {
            name = log.info.user.name
        } else if (type.startsWith("role_") && log.info?.role) {
            name = log.info.role.name
        } else if (type.startsWith("entity_") && log.info?.entity) {
            name = log.info.entity.name
        }

        return t(type, { name })
    }

    // Périodes prédéfinies pour le sélecteur de dates
    const preSelectedRanges = [
        {
            label: t("lastXDays", { days: 7 }),
            dateRange: {
                from: subDays(new Date(), 7),
                to: new Date(),
            },
        },
        {
            label: t("lastXDays", { days: 30 }),
            dateRange: {
                from: subDays(new Date(), 30),
                to: new Date(),
            },
        },
        {
            label: t("lastXDays", { days: 90 }),
            dateRange: {
                from: subDays(new Date(), 90),
                to: new Date(),
            },
        },
    ]

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                <div className="col-span-2">
                    <label className="text-sm font-medium mb-1 block">{t("dateRange")}</label>
                    <DatePickerRange
                        date={dateRange}
                        setDate={setDateRange}
                        preSelectedRanges={preSelectedRanges}
                        textHolder={t("selectDateRange")}
                        className="w-full"
                        includeTime={true}
                    />
                </div>

                <div className="flex items-end">
                    <Button
                        variant="outline"
                        onClick={loadLogs}
                        className="w-full"
                        disabled={isLoadingData}
                    >
                        {isLoadingData ? tCommon("loading") : tCommon("refresh")}
                    </Button>
                </div>
                <div className="flex items-end">
                    <Button
                        variant="outline"
                        onClick={resetFilters}
                        className="w-full"
                    >
                        {tCommon("reset")}
                    </Button>
                </div>

                <div>
                    <label className="text-sm font-medium mb-1 block">{t("filterByType")}</label>
                    <Combobox
                        options={logTypes}
                        value={filters.logType}
                        onChange={(value) => handleFilterChange("logType", value)}
                        placeholder={t("selectLogType")}
                        emptyMessage={tCommon("noOptions")}
                        multiple={true}
                    />
                </div>
                <div>
                    <label className="text-sm font-medium mb-1 block">{t("filterByUser")}</label>
                    <Combobox
                        options={getFilterOptions(logs, "user")}
                        value={filters.user}
                        onChange={(value) => handleFilterChange("user", value)}
                        placeholder={t("selectUser")}
                        emptyMessage={tCommon("noOptions")}
                        multiple={true}
                    />
                </div>
                <div>
                    <label className="text-sm font-medium mb-1 block">{t("filterByEntity")}</label>
                    <Combobox
                        options={getFilterOptions(logs, "entity")}
                        value={filters.entity}
                        onChange={(value) => handleFilterChange("entity", value)}
                        placeholder={t("selectEntity")}
                        emptyMessage={tCommon("noOptions")}
                        multiple={true}
                    />
                </div>
                <div>
                    <label className="text-sm font-medium mb-1 block">{t("filterByRole")}</label>
                    <Combobox
                        options={getFilterOptions(logs, "role")}
                        value={filters.role}
                        onChange={(value) => handleFilterChange("role", value)}
                        placeholder={t("selectRole")}
                        emptyMessage={tCommon("noOptions")}
                        multiple={true}
                    />
                </div>
            </div>
            {filterLoading || isLoadingData ? (
                <div>
                    <Skeleton className="h-[35px] w-full mb-0.5" />
                    <Skeleton className="h-[395px] w-full mb-0.5" />
                    <Skeleton className="h-[30px] w-full" />
                </div>
            ) : (
                <DataTable
                    data={filteredLogs}
                    columns={columns}
                    keyExtractor={(log: { id: string }) => log.id}
                    pageSizeOptions={[10, 50, 100]}
                    defaultPageSize={10}
                    noDataMessage={t("noLogs")}
                />
            )}
        </div>
    )
}
