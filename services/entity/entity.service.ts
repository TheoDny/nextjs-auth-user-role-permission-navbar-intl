import { DeleteEntityUserAssignedError } from "@/errors/DeleteEntityUserAssignedError"
import { EntityAccessDeniedError } from "@/errors/EntityAccessDeniedError"
import { EntityNameAlreadyInUseError } from "@/errors/EntityNameAlreadyInUseError"
import { EntityNotFound } from "@/errors/EntityNotFound"
import { prisma } from "@/lib/prisma"
import { assertNotProtectedEntityId } from "@/lib/utils"
import { addEntityDisableLog, addEntityUpdateLog } from "@/services/log/log.service"
import { revalidatePath } from "next/cache"

export async function getEntities(userId?: string) {
    const entities = await prisma.entity.findMany({
        where: {
            deletedAt: null,
            ...(userId
                ? {
                      Users: {
                          some: {
                              id: userId,
                              deletedAt: null,
                          },
                      },
                  }
                : {}),
        },
        include: {
            Users: {
                where: {
                    deletedAt: null,
                },
                select: {
                    id: true,
                },
            },
        },
        orderBy: {
            name: "asc",
        },
    })

    return entities
}

export async function countEntities() {
    return await prisma.entity.count({
        where: {
            deletedAt: null,
        },
    })
}

async function assertEntityNameAvailable(name: string, excludedEntityId?: string) {
    const duplicate = await prisma.entity.findFirst({
        where: {
            deletedAt: null,
            name: {
                equals: name,
                mode: "insensitive",
            },
            ...(excludedEntityId
                ? {
                      id: {
                          not: excludedEntityId,
                      },
                  }
                : {}),
        },
    })

    if (duplicate) {
        throw new EntityNameAlreadyInUseError()
    }
}

async function assertUserOwnsEntity(userId: string, entityId: string) {
    const hasEntity = await prisma.user.findFirst({
        where: {
            id: userId,
            deletedAt: null,
            Entities: {
                some: {
                    id: entityId,
                },
            },
        },
        select: {
            id: true,
        },
    })

    if (!hasEntity) {
        throw new EntityAccessDeniedError()
    }
}

export async function createEntity(data: { name: string; creatorUserId: string }) {
    await assertEntityNameAvailable(data.name)

    const entity = await prisma.entity.create({
        data: {
            name: data.name,
            Users: {
                connect: {
                    id: data.creatorUserId,
                },
            },
        },
        include: {
            Users: {
                where: {
                    deletedAt: null,
                },
                select: {
                    id: true,
                },
            },
        },
    })

    revalidatePath("/administration/entities")
    return entity
}

export async function updateEntity(id: string, data: { name: string; userId: string }) {
    assertNotProtectedEntityId(id)
    await assertUserOwnsEntity(data.userId, id)

    const existing = await prisma.entity.findFirst({
        where: {
            id,
            deletedAt: null,
        },
    })

    if (!existing) {
        throw new EntityNotFound()
    }

    await assertEntityNameAvailable(data.name, id)

    const entity = await prisma.entity.update({
        where: { id },
        data: {
            name: data.name,
        },
        include: {
            Users: {
                where: {
                    deletedAt: null,
                },
                select: {
                    id: true,
                },
            },
        },
    })

    addEntityUpdateLog({ id: entity.id, name: entity.name }, entity.id)

    revalidatePath("/administration/entities")
    return entity
}

export async function deleteEntity(id: string, userId: string) {
    assertNotProtectedEntityId(id)
    await assertUserOwnsEntity(userId, id)

    const entity = await prisma.entity.findFirst({
        where: {
            id,
            deletedAt: null,
        },
    })

    if (!entity) {
        throw new EntityNotFound()
    }

    const userCount = await prisma.user.count({
        where: {
            id: {
                not: userId,
            },
            deletedAt: null,
            OR: [
                {
                    entitySelectedId: id,
                },
                {
                    Entities: {
                        some: {
                            id,
                        },
                    },
                },
            ],
        },
    })

    if (userCount > 0) {
        throw new DeleteEntityUserAssignedError()
    }

    const deletedEntity = await prisma.entity.update({
        where: {
            id,
        },
        data: {
            deletedAt: new Date(),
        },
        include: {
            Users: {
                where: {
                    deletedAt: null,
                },
                select: {
                    id: true,
                },
            },
        },
    })

    addEntityDisableLog({ id: entity.id, name: entity.name }, entity.id)

    revalidatePath("/administration/entities")
    return deletedEntity
}

