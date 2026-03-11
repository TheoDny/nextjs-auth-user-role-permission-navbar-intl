import { RoleManagement } from "@/components/role-management/role-management"
import { Skeleton } from "@/components/ui/skeleton"
import { pageCheckAuth } from "@/lib/auth-guard"
import { getPermissions } from "@/services/permission/permission.service"
import { getRoles } from "@/services/role/role.service"
import { SessionUser } from "@/types/user.type"
import { getTranslations } from "next-intl/server"
import { Suspense } from "react"

export default async function RolesPage() {
    const session = await pageCheckAuth({ requiredPermission: "role_read" })
    const t = await getTranslations("RoleManagement")

    return (
        <div className="p-2">
            <div className="h-[70px]">
                <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
                <p className="text-muted-foreground">{t("description")}</p>
            </div>
            <div className="h-[calc(100vh-100px)]">
                <Suspense fallback={<RoleManagementSkeleton />}>
                    <RoleManagementContent sessionUser={session.user} />
                </Suspense>
            </div>
        </div>
    )
}

async function RoleManagementContent({ sessionUser }: { sessionUser: SessionUser }) {
    const [roles, permissions] = await Promise.all([getRoles(), getPermissions()])

    return <RoleManagement sessionUser={sessionUser} preloadedRoles={roles} permissions={permissions} />
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
