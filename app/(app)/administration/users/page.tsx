import { Skeleton } from "@/components/ui/skeleton"
import { UserManagement } from "@/components/user-management/user-management"
import { pageCheckAuth } from "@/lib/auth-guard"
import { getRoles } from "@/services/role/role.service"
import { getUsers } from "@/services/user/user.service"
import { SessionUser } from "@/types/user.type"
import { getTranslations } from "next-intl/server"
import { Suspense } from "react"

export default async function UsersPage() {
    const session = await pageCheckAuth({ requiredPermission: "user_read" })
    const t = await getTranslations("UserManagement")

    delete session.user.image

    return (
        <div className="p-2">
            <div className="h-[70px]">
                <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
                <p className="text-muted-foreground">{t("description")}</p>
            </div>
            <div className="h-[calc(100vh-100px)]">
                <Suspense fallback={<UserManagementSkeleton />}>
                    <UserManagementContent sessionUser={session.user} />
                </Suspense>
            </div>
        </div>
    )
}

async function UserManagementContent({ sessionUser }: { sessionUser: SessionUser }) {
    const [users, roles] = await Promise.all([getUsers(), getRoles()])

    return <UserManagement sessionUser={sessionUser} preloadedUsers={users} roles={roles} />
}

function UserManagementSkeleton() {
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
