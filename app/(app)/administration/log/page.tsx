import { LogTable } from "@/components/log-management/log-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { auth } from "@/lib/auth"
import { getLogs } from "@/services/log.service"
import { LogEntry } from "@/types/log.type"
import { subDays } from "date-fns"
import { getTranslations } from "next-intl/server"
import { headers } from "next/headers"
import { unauthorized } from "next/navigation"
import { Suspense } from "react"

export default async function LogPage() {
    const sevenDaysAgo = subDays(new Date(), 7)
    const t = await getTranslations("Logs")

    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) {
        unauthorized()
    }

    const entityIds = session.user.Entities.map((entity: { id: string }) => entity.id)

    // Get logs for initial load (last 7 days)
    const logs: LogEntry[] = await getLogs(entityIds, sevenDaysAgo)

    return (
        <div className="container mx-auto py-6">
            <Card>
                <CardHeader>
                    <CardTitle>{t("title")}</CardTitle>
                    <CardDescription>{t("description")}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={<LogTableSkeleton />}>
                        <LogTable logs={logs} />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    )
}

function LogTableSkeleton() {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, index) => (
                    <div key={index}>
                        <Skeleton className="h-5 w-32 mb-2" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ))}
            </div>

            <Skeleton className="h-[400px] w-full mt-6" />
        </div>
    )
}
