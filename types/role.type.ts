import { Prisma } from "@/prisma/generated"

export type RolePermissions = Prisma.RoleGetPayload<{
    include: {
        Permissions: true
    }
}>
