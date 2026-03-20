"use server"

import { checkAuth } from "@/lib/auth-guard"
import { MaxNumberEntityError } from "@/errors/MaxNumberEntityError"
import { actionClient } from "@/lib/safe-action"
import { countEntities, createEntity, deleteEntity, getEntities, updateEntity } from "@/services/entity/entity.service"
import { z } from "zod"

const createEntitySchema = z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(64, "Name must be at most 64 characters"),
})

const updateEntitySchema = z.object({
    id: z.string().trim(),
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(64, "Name must be at most 64 characters"),
})

const deleteEntitySchema = z.object({
    id: z.string().trim(),
})

export async function getEntitiesAction() {
    const session = await checkAuth({ requiredPermission: "entity_read" })
    return await getEntities(session.user.id)
}

export const createEntityAction = actionClient
    .inputSchema(createEntitySchema)
    .action(async ({ parsedInput }) => {
        const session = await checkAuth({ requiredPermission: "entity_create" })

        if (process.env.NEXT_PUBLIC_MAX_ENTITY) {
            const maxEntities = parseInt(process.env.NEXT_PUBLIC_MAX_ENTITY)
            const currentEntitiesCount = await countEntities()
            if (currentEntitiesCount >= maxEntities) {
                throw new MaxNumberEntityError(maxEntities)
            }
        }

        return await createEntity({ ...parsedInput, creatorUserId: session.user.id })
    })

export const updateEntityAction = actionClient
    .inputSchema(updateEntitySchema)
    .action(async ({ parsedInput }) => {
        const session = await checkAuth({ requiredPermission: "entity_edit" })
        return await updateEntity(parsedInput.id, { name: parsedInput.name, userId: session.user.id })
    })

export const deleteEntityAction = actionClient
    .inputSchema(deleteEntitySchema)
    .action(async ({ parsedInput }) => {
        const session = await checkAuth({ requiredPermission: "entity_create" })
        return await deleteEntity(parsedInput.id, session.user.id)
    })

