import { Prisma } from "@/prisma/generated/client"

export type RolePermissions = Prisma.RoleGetPayload<{
    include: {
        Permissions: true
    }
}>
