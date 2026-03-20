import { DeleteEntityUserAssignedError } from "@/errors/DeleteEntityUserAssignedError"
import { EntityAccessDeniedError } from "@/errors/EntityAccessDeniedError"
import { EntityNameAlreadyInUseError } from "@/errors/EntityNameAlreadyInUseError"
import { NoEditSeededEntity } from "@/errors/NoEditSeededEntity"
import { prisma } from "@/lib/prisma"
import { protectedEntityIds } from "@/prisma/data-seed"
import { withRollbackTransaction } from "@/tests/helpers/prisma-transaction"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createEntity, deleteEntity, updateEntity } from "./entity.service"

vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
}))

describe.sequential("entity.service (db transaction)", () => {
    const createUser = async (suffix: string) => {
        return await prisma.user.create({
            data: {
                email: `entity-service-${suffix}@example.com`,
                name: `EntityServiceUser-${suffix}`,
                entitySelectedId: protectedEntityIds[0],
                Entities: {
                    connect: [{ id: protectedEntityIds[0] }],
                },
            },
        })
    }

    beforeEach(() => {
        vi.spyOn(console, "error").mockImplementation(() => {})
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it("creates and updates an entity", async () => {
        await withRollbackTransaction(async () => {
            const user = await createUser("create-update")

            const created = await createEntity({ name: "EntityServiceCreate", creatorUserId: user.id })
            const updated = await updateEntity(created.id, { name: "EntityServiceUpdated", userId: user.id })

            expect(created.name).toBe("EntityServiceCreate")
            expect(updated.name).toBe("EntityServiceUpdated")
            expect(created.Users.some((u) => u.id === user.id)).toBe(true)
            return true
        })
    })

    it("throws when updating a protected seeded entity", async () => {
        await withRollbackTransaction(async () => {
            const user = await createUser("protected-update")
            await expect(updateEntity(protectedEntityIds[0], { name: "BlockedUpdate", userId: user.id })).rejects.toBeInstanceOf(
                NoEditSeededEntity,
            )
            return true
        })
    })

    it("throws when deleting an entity assigned to users", async () => {
        await withRollbackTransaction(async () => {
            const owner = await createUser("delete-assigned-owner")
            const entity = await createEntity({ name: "EntityDeleteAssigned", creatorUserId: owner.id })
            await prisma.user.create({
                data: {
                    email: "entity-assigned@example.com",
                    name: "EntityAssignedUser",
                    entitySelectedId: entity.id,
                    Entities: { connect: [{ id: entity.id }] },
                },
            })

            await expect(deleteEntity(entity.id, owner.id)).rejects.toBeInstanceOf(DeleteEntityUserAssignedError)
            return true
        })
    })

    it("soft deletes a non protected entity", async () => {
        await withRollbackTransaction(async () => {
            const owner = await createUser("delete-allowed")
            const entity = await createEntity({ name: "EntityDeleteAllowed", creatorUserId: owner.id })
            const deleted = await deleteEntity(entity.id, owner.id)

            expect(deleted.deletedAt).not.toBeNull()
            return true
        })
    })

    it("throws when entity name already exists", async () => {
        await withRollbackTransaction(async () => {
            const owner = await createUser("duplicate-name")
            await createEntity({ name: "EntityUnique", creatorUserId: owner.id })

            await expect(createEntity({ name: "entityunique", creatorUserId: owner.id })).rejects.toBeInstanceOf(
                EntityNameAlreadyInUseError,
            )
            return true
        })
    })

    it("throws when user does not own entity on update/delete", async () => {
        await withRollbackTransaction(async () => {
            const owner = await createUser("owner")
            const outsider = await createUser("outsider")
            const entity = await createEntity({ name: "EntityOwnership", creatorUserId: owner.id })

            await expect(updateEntity(entity.id, { name: "EntityOwnershipUpdated", userId: outsider.id })).rejects.toBeInstanceOf(
                EntityAccessDeniedError,
            )
            await expect(deleteEntity(entity.id, outsider.id)).rejects.toBeInstanceOf(EntityAccessDeniedError)
            return true
        })
    })
})

