import { Prisma } from "@/prisma/generated"

export type UserRolesAndEntities = Prisma.UserGetPayload<{
    include: {
        Roles: true
        Entities: true
    }
}>
