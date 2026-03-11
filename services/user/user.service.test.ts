import { NeedEntityAttributedError } from "@/errors/NeedEntityAttributed"
import { prisma } from "@/lib/prisma"
import { withRollbackTransaction } from "@/tests/helpers/prisma-transaction"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
    changeEntitySelected,
    createUser,
    deleteUser,
    signUpUser,
    updateUser,
    updateUserProfile,
} from "./user.service"

const { signUpEmailMock, sendInvitationSignUpMock } = vi.hoisted(() => ({
    signUpEmailMock: vi.fn(),
    sendInvitationSignUpMock: vi.fn(),
}))

vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
}))

vi.mock("@/services/log.service", () => ({
    addUserCreateLog: vi.fn(),
    addUserDisableLog: vi.fn(),
    addUserEmailVerifiedLog: vi.fn(),
    addUserSetEntityLog: vi.fn(),
    addUserSetRoleLog: vi.fn(),
    addUserUpdateLog: vi.fn(),
}))

vi.mock("@/services/mail.service", () => ({
    sendInvitationSignUp: sendInvitationSignUpMock,
}))

vi.mock("@/lib/auth", () => ({
    auth: {
        api: {
            signUpEmail: signUpEmailMock,
        },
    },
}))

describe.sequential("user.service (db transaction)", () => {
    beforeEach(() => {
        vi.spyOn(console, "error").mockImplementation(() => {})
        sendInvitationSignUpMock.mockReset()
        signUpEmailMock.mockReset()
        vi.stubEnv("JWT_SECRET", "test-secret")
        vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000")
    })

    it("throws NeedEntityAttributedError when creating user without entities", async () => {
        await withRollbackTransaction(async () => {
            await expect(
                createUser({
                    name: "NoEntity",
                    email: "no-entity@example.com",
                    active: true,
                    entities: [],
                })
            ).rejects.toBeInstanceOf(NeedEntityAttributedError)
            return true
        })
    })

    it("creates user when entity exists and invitation succeeds", async () => {
        await withRollbackTransaction(async () => {
            sendInvitationSignUpMock.mockResolvedValue(true)
            const entity = await prisma.entity.create({ data: { name: "EntityUserCreate" } })

            const created = await createUser({
                name: "UserCreate",
                email: "user-create@example.com",
                active: true,
                entities: [entity.id],
            })

            expect(created.email).toBe("user-create@example.com")
            expect(created.entitySelectedId).toBe(entity.id)
            return true
        })
    })

    it("updates user profile and changes selected entity", async () => {
        await withRollbackTransaction(async () => {
            const entityA = await prisma.entity.create({ data: { name: "EntityUserA" } })
            const entityB = await prisma.entity.create({ data: { name: "EntityUserB" } })
            const user = await prisma.user.create({
                data: {
                    email: "profile-user@example.com",
                    name: "Profile User",
                    entitySelectedId: entityA.id,
                    Entities: { connect: [{ id: entityA.id }, { id: entityB.id }] },
                },
            })

            const updatedProfile = await updateUserProfile(user.id, {
                name: "Updated Name",
                email: "profile-user@example.com",
                image: "https://example.com/img.png",
            })
            const changedEntity = await changeEntitySelected(user.id, entityB.id)

            expect(updatedProfile.name).toBe("Updated Name")
            expect(changedEntity.entitySelectedId).toBe(entityB.id)
            return true
        })
    })

    it("signUpUser migrates roles and entities to new auth user", async () => {
        await withRollbackTransaction(async () => {
            const entity = await prisma.entity.create({ data: { name: "EntitySignUp" } })
            const role = await prisma.role.create({ data: { name: "RoleSignUp", description: "desc" } })
            const existingUser = await prisma.user.create({
                data: {
                    email: "signup-user@example.com",
                    name: "Signup User",
                    active: true,
                    entitySelectedId: entity.id,
                    Entities: { connect: [{ id: entity.id }] },
                    Roles: { connect: [{ id: role.id }] },
                },
            })

            signUpEmailMock.mockResolvedValue({
                user: {
                    id: "new-auth-user-id",
                },
            })

            await prisma.user.create({
                data: {
                    id: "new-auth-user-id",
                    email: "new-auth-user@example.com",
                    name: "New Auth User",
                    active: true,
                    entitySelectedId: entity.id,
                    Entities: { connect: [{ id: entity.id }] },
                },
            })

            const result = await signUpUser("Signup User", "signup-user@example.com", "Test0123456789!")
            const migratedUser = await prisma.user.findUnique({
                where: { id: "new-auth-user-id" },
                include: { Roles: true, Entities: true },
            })

            expect(result).toBe(true)
            expect(signUpEmailMock).toHaveBeenCalledTimes(1)
            expect(migratedUser?.Roles.some((r) => r.id === role.id)).toBe(true)
            expect(migratedUser?.Entities.some((e) => e.id === entity.id)).toBe(true)
            expect(existingUser.id).not.toBe(migratedUser?.id)
            return true
        })
    })

    it("updates user and then soft deletes it", async () => {
        await withRollbackTransaction(async () => {
            const entityA = await prisma.entity.create({ data: { name: "EntityUpdateA" } })
            const entityB = await prisma.entity.create({ data: { name: "EntityUpdateB" } })
            const user = await prisma.user.create({
                data: {
                    email: "delete-user@example.com",
                    name: "Delete User",
                    active: true,
                    entitySelectedId: entityA.id,
                    Entities: { connect: [{ id: entityA.id }] },
                },
            })

            const updated = await updateUser(user.id, {
                name: "Delete User Updated",
                email: "delete-user@example.com",
                active: false,
                entitiesToAdd: [entityB.id],
                entitiesToRemove: [entityA.id],
            })
            const deleted = await deleteUser(user.id, "current-user-id")

            expect(updated.active).toBe(false)
            expect(updated.Entities.some((e) => e.id === entityB.id)).toBe(true)
            expect(deleted.deletedAt).toBeTruthy()
            expect(deleted.email).toContain("_deleted_")
            return true
        })
    })
})
