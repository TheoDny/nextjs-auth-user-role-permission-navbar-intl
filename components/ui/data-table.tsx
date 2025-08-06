"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { useEffect, useState } from "react"

export type Column<T> = {
    key: string
    header: string
    cell: (item: T) => React.ReactNode
}

type DataTableProps<T> = {
    data: T[]
    columns: Column<T>[]
    keyExtractor: (item: T) => string
    pageSizeOptions?: number[]
    defaultPageSize?: number
    noDataMessage?: string
    className?: string
}

export function DataTable<T>({
    data,
    columns,
    keyExtractor,
    pageSizeOptions = [10, 50, 100],
    defaultPageSize = 10,
    noDataMessage = "No data available",
    className,
}: DataTableProps<T>) {
    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(defaultPageSize)
    const [paginatedData, setPaginatedData] = useState<T[]>([])
    const [totalPages, setTotalPages] = useState(1)

    // Mettre à jour la pagination quand les données ou les paramètres de pagination changent
    useEffect(() => {
        if (data.length === 0) {
            setPaginatedData([])
            setTotalPages(1)
            return
        }

        const totalPages = Math.ceil(data.length / itemsPerPage)
        setTotalPages(totalPages)

        // Ajuster la page courante si nécessaire
        if (currentPage > totalPages) {
            setCurrentPage(totalPages)
        }

        const startIndex = (currentPage - 1) * itemsPerPage
        const endIndex = Math.min(startIndex + itemsPerPage, data.length)
        setPaginatedData(data.slice(startIndex, endIndex))
    }, [data, currentPage, itemsPerPage])

    // Navigation de pagination
    const goToPage = (page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)))
    }

    const goToFirstPage = () => goToPage(1)
    const goToPreviousPage = () => goToPage(currentPage - 1)
    const goToNextPage = () => goToPage(currentPage + 1)
    const goToLastPage = () => goToPage(totalPages)

    return (
        <div className="space-y-4">
            {data.length === 0 ? (
                <div className="text-center p-6">
                    <p>{noDataMessage}</p>
                </div>
            ) : (
                <>
                    <div className={`rounded-md border overflow-hidden ${className}`}>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {columns.map((column) => (
                                        <TableHead key={column.key}>{column.header}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedData.map((item) => (
                                    <TableRow key={keyExtractor(item)}>
                                        {columns.map((column) => (
                                            <TableCell key={`${keyExtractor(item)}-${column.key}`}>
                                                {column.cell(item)}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination controls */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <p className="text-sm text-muted-foreground">
                                {data.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
                                {" - "}
                                {Math.min(currentPage * itemsPerPage, data.length)} {" -- (" + data.length + ")"}
                            </p>
                            <div className="flex items-center space-x-2">
                                <Select
                                    value={itemsPerPage.toString()}
                                    onValueChange={(value) => {
                                        setItemsPerPage(parseInt(value))
                                        setCurrentPage(1)
                                    }}
                                >
                                    <SelectTrigger className="h-8 w-[80px]">
                                        <SelectValue placeholder={itemsPerPage.toString()} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {pageSizeOptions.map((size) => (
                                            <SelectItem
                                                key={size}
                                                value={size.toString()}
                                            >
                                                {size}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={goToFirstPage}
                                disabled={currentPage === 1}
                            >
                                <ChevronsLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={goToPreviousPage}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm">
                                {currentPage} / {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={goToNextPage}
                                disabled={currentPage >= totalPages}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={goToLastPage}
                                disabled={currentPage >= totalPages}
                            >
                                <ChevronsRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
