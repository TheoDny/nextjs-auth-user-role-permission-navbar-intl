import { Skeleton } from "@/components/ui/skeleton"
import { UserManagement } from "@/components/user-management/user-management"
import { auth } from "@/lib/auth"
import { getTranslations } from "next-intl/server"
import { headers } from "next/headers"
import { Suspense } from "react"

export default async function UsersPage() {
    const t = await getTranslations("UserManagement")

    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) {
        return null
    }

    delete session.user.image

    return (
        <div className="p-2">
            <div className="h-[70px]">
                <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
                <p className="text-muted-foreground">{t("description")}</p>
            </div>
            <div className="h-[calc(100vh-100px)]">
                <Suspense fallback={<UserManagementSkeleton />}>
                    <UserManagement
                        // @ts-expect-error because i removed image
                        sessionUser={session.user}
                    />
                </Suspense>
            </div>
        </div>
    )
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
