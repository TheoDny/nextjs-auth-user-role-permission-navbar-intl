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
import { parseAsArrayOf, parseAsIsoDateTime, parseAsString, useQueryState } from "nuqs"
import { useEffect, useMemo, useRef, useState } from "react"
import { DateRange } from "react-day-picker"
import { Skeleton } from "../ui/skeleton"

export function LogTable({ logs }: { logs: LogEntry[] }) {
    const t = useTranslations("Logs")
    const tCommon = useTranslations("Common")
    const defaultDateRange = useMemo(
        () => ({
            from: subDays(new Date(), 7),
            to: new Date(),
        }),
        [],
    )
    const [allLogs, setAllLogs] = useState<LogEntry[]>(logs)
    const [isInitialLoading, setIsInitialLoading] = useState(logs.length === 0)
    const [isLoadingData, setIsLoadingData] = useState(false)
    const hasMountedRef = useRef(false)
    const latestRequestRef = useRef(0)

    const [fromQuery, setFromQuery] = useQueryState(
        "from",
        parseAsIsoDateTime.withOptions({
            history: "replace",
            scroll: false,
        }),
    )
    const [toQuery, setToQuery] = useQueryState(
        "to",
        parseAsIsoDateTime.withOptions({
            history: "replace",
            scroll: false,
        }),
    )

    const [logTypeQuery, setLogTypeQuery] = useQueryState(
        "types",
        parseAsArrayOf(parseAsString).withOptions({
            history: "replace",
            scroll: false,
            clearOnDefault: true,
        }),
    )
    const [userQuery, setUserQuery] = useQueryState(
        "users",
        parseAsArrayOf(parseAsString).withOptions({
            history: "replace",
            scroll: false,
            clearOnDefault: true,
        }),
    )
    const [entityQuery, setEntityQuery] = useQueryState(
        "entities",
        parseAsArrayOf(parseAsString).withOptions({
            history: "replace",
            scroll: false,
            clearOnDefault: true,
        }),
    )
    const [roleQuery, setRoleQuery] = useQueryState(
        "roles",
        parseAsArrayOf(parseAsString).withOptions({
            history: "replace",
            scroll: false,
            clearOnDefault: true,
        }),
    )

    const dateRange = useMemo<DateRange>(
        () => ({
            from: fromQuery ?? defaultDateRange.from,
            to: toQuery ?? fromQuery ?? defaultDateRange.to,
        }),
        [defaultDateRange.from, defaultDateRange.to, fromQuery, toQuery],
    )

    const filters = useMemo<{
        logType: string[]
        user: string[]
        entity: string[]
        role: string[]
    }>(
        () => ({
            logType: logTypeQuery ?? [],
            user: userQuery ?? [],
            entity: entityQuery ?? [],
            role: roleQuery ?? [],
        }),
        [entityQuery, logTypeQuery, roleQuery, userQuery],
    )

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
        if (!dateRange.from) return

        const requestId = ++latestRequestRef.current
        setIsLoadingData(true)
        try {
            let result = await getLogsAction({
                startDate: dateRange.from.toISOString(),
                endDate: (dateRange.to ?? dateRange.from).toISOString(),
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

            if (requestId !== latestRequestRef.current) return

            setAllLogs(result.data as LogEntry[])
            setIsInitialLoading(false)
            setIsLoadingData(false)
        } catch (error) {
            if (requestId !== latestRequestRef.current) return
            console.error("Error loading logs:", error)
            setIsInitialLoading(false)
            setIsLoadingData(false)
        }
    }

    // Charger les logs au changement de dates
    useEffect(() => {
        if (!hasMountedRef.current) {
            hasMountedRef.current = true
            return
        }

        if (!dateRange.from) return

        const timeoutId = setTimeout(() => {
            void loadLogs()
        }, 150)

        return () => clearTimeout(timeoutId)
    }, [dateRange])

    // Charger les logs initiaux
    useEffect(() => {
        setAllLogs(logs)
        setIsInitialLoading(false)
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

    const filteredLogs = useMemo(() => {
        let result = [...allLogs]

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

        return result
    }, [allLogs, filters])

    // Handle filter change
    const handleFilterChange = (
        key: "logType" | "user" | "entity" | "role",
        value: string | string[],
    ) => {
        const nextValue = Array.isArray(value) ? value : value ? [value] : []

        switch (key) {
            case "logType":
                void setLogTypeQuery(nextValue.length > 0 ? nextValue : null)
                break
            case "user":
                void setUserQuery(nextValue.length > 0 ? nextValue : null)
                break
            case "entity":
                void setEntityQuery(nextValue.length > 0 ? nextValue : null)
                break
            case "role":
                void setRoleQuery(nextValue.length > 0 ? nextValue : null)
                break
        }
    }

    // Reset all filters
    const resetFilters = () => {
        void setLogTypeQuery(null)
        void setUserQuery(null)
        void setEntityQuery(null)
        void setRoleQuery(null)
    }

    const handleDateRangeChange = (newDateRange: DateRange | undefined) => {
        const nextFrom = newDateRange?.from ?? null
        const nextTo = newDateRange?.to ?? newDateRange?.from ?? null
        void setFromQuery(nextFrom)
        void setToQuery(nextTo)
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
                        setDate={handleDateRangeChange}
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
                        options={getFilterOptions(allLogs, "user")}
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
                        options={getFilterOptions(allLogs, "entity")}
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
                        options={getFilterOptions(allLogs, "role")}
                        value={filters.role}
                        onChange={(value) => handleFilterChange("role", value)}
                        placeholder={t("selectRole")}
                        emptyMessage={tCommon("noOptions")}
                        multiple={true}
                    />
                </div>
            </div>
            {isInitialLoading || isLoadingData ? (
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
