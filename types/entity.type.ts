import { Prisma } from "@/prisma/generated/client"

export type EntitySmall = {
    id: string
    name: string
}

export type EntityUsers = Prisma.EntityGetPayload<{
    include: {
        Users: {
            select: {
                id: true
            }
        }
    }
}>