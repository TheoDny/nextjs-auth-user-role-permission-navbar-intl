import { Prisma } from "@/prisma/generated/client"

export type UserRolesAndEntities = Prisma.UserGetPayload<{
    include: {
        Roles: true
        Entities: true
    }
}>
