import { RoleManagement } from "@/components/role-management/role-management"
import { Skeleton } from "@/components/ui/skeleton"
import { getTranslations } from "next-intl/server"
import { Suspense } from "react"

export default async function RolesPage() {
    const t = await getTranslations("RoleManagement")

    return (
        <div className="p-2">
            <div className="h-[70px]">
                <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
                <p className="text-muted-foreground">{t("description")}</p>
            </div>
            <div className="h-[calc(100vh-100px)]">
                <Suspense fallback={<RoleManagementSkeleton />}>
                    <RoleManagement />
                </Suspense>
            </div>
        </div>
    )
}

function RoleManagementSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            <div className="space-y-4 h-full">
                <Skeleton className="h-full w-full" />
            </div>
            <div className="space-y-4">
                <Skeleton className="h-full w-full" />
            </div>
        </div>
    )
}
