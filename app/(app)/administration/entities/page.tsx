import { EntityManagement } from "@/components/entity-management/entity-management"
import { Skeleton } from "@/components/ui/skeleton"
import { pageCheckAuth } from "@/lib/auth-guard"
import { getEntities } from "@/services/entity/entity.service"
import { SessionUser } from "@/types/user.type"
import { getTranslations } from "next-intl/server"
import { Suspense } from "react"

export default async function EntitiesPage() {
    const session = await pageCheckAuth({ requiredPermission: "entity_read" })
    const t = await getTranslations("EntityManagement")

    return (
        <div className="p-2">
            <div className="h-[70px]">
                <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
                <p className="text-muted-foreground">{t("description")}</p>
            </div>
            <div className="h-[calc(100vh-100px)]">
                <Suspense fallback={<EntityManagementSkeleton />}>
                    <EntityManagementContent sessionUser={session.user} />
                </Suspense>
            </div>
        </div>
    )
}

async function EntityManagementContent({ sessionUser }: { sessionUser: SessionUser }) {
    const entities = await getEntities(sessionUser.id)

    return <EntityManagement sessionUser={sessionUser} preloadedEntities={entities} />
}

function EntityManagementSkeleton() {
    return (
        <div className="space-y-4 h-full">
            <Skeleton className="h-full w-full" />
        </div>
    )
}

