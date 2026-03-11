import { Prisma } from "@/prisma/generated/client"
import { EntitySmall } from "./entity.type"

export type UserRolesAndEntities = Prisma.UserGetPayload<{
    include: {
        Roles: true
        Entities: true
    }
}>

export type SessionUser = {
    id: string
    createdAt: Date
    updatedAt: Date
    email: string
    emailVerified: boolean
    name: string
    entitySelectedId: string
    active: boolean
    Roles: {
        id: string
        name: string
    }[]
    Permissions: {
        code: string
    }[]
    Entities: EntitySmall[]
    EntitySelected: EntitySmall
}
