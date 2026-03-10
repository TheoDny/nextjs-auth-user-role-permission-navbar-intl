import { prisma } from "@/lib/prisma"
import jwt from "jsonwebtoken"
import { afterEach, describe, expect, it, vi } from "vitest"
import { withRollbackTransaction } from "@/tests/helpers/prisma-transaction"
import { checkToken, createTokenUser, getUserRolesPermissionsAndEntities } from "./auth.service"

describe.sequential("auth.service (db transaction)", () => {
    afterEach(() => {
        vi.unstubAllEnvs()
    })

    it("returns false when token is missing in database", async () => {
        await withRollbackTransaction(async () => {
            vi.stubEnv("JWT_SECRET", "test-secret")
            const result = await checkToken("missing-token", "missing@example.com")
            expect(result).toBe(false)
            return true
        })
    })

    it("returns decoded payload when token exists and jwt is valid", async () => {
        await withRollbackTransaction(async () => {
            vi.stubEnv("JWT_SECRET", "test-secret")
            const token = jwt.sign({ name: "Alice", email: "alice@example.com" }, "test-secret")

            await prisma.tokenCreateUser.create({
                data: {
                    email: "alice@example.com",
                    token,
                    expiresAt: new Date(Date.now() + 86_400_000),
                },
            })

            const result = await checkToken(token, "alice@example.com")
            expect(result).toEqual(
                expect.objectContaining({
                    name: "Alice",
                    email: "alice@example.com",
                })
            )
            return true
        })
    })

    it("creates token record with createTokenUser", async () => {
        await withRollbackTransaction(async () => {
            vi.stubEnv("JWT_SECRET", "test-secret")
            const created = await createTokenUser("Bob", "bob@example.com")

            expect(created.email).toBe("bob@example.com")
            expect(typeof created.token).toBe("string")
            return true
        })
    })

    it("returns deduplicated permissions with user roles and entities", async () => {
        await withRollbackTransaction(async () => {
            const entity = await prisma.entity.create({
                data: { name: "EntityAuthTest" },
            })
            await prisma.permission.createMany({
                data: [{ code: "perm_read_auth_test" }, { code: "perm_edit_auth_test" }],
                skipDuplicates: true,
            })
            const roleA = await prisma.role.create({
                data: {
                    name: "RoleAuthA",
                    description: "role",
                    Permissions: { connect: [{ code: "perm_read_auth_test" }, { code: "perm_edit_auth_test" }] },
                },
            })
            const roleB = await prisma.role.create({
                data: {
                    name: "RoleAuthB",
                    description: "role",
                    Permissions: { connect: [{ code: "perm_read_auth_test" }] },
                },
            })

            const user = await prisma.user.create({
                data: {
                    email: "auth-user@example.com",
                    name: "AuthUser",
                    entitySelectedId: entity.id,
                    Entities: { connect: [{ id: entity.id }] },
                    Roles: { connect: [{ id: roleA.id }, { id: roleB.id }] },
                },
            })

            const result = await getUserRolesPermissionsAndEntities(user.id)
            const permissionCodes = result.Permissions.map((p) => p.code).sort()

            expect(permissionCodes).toEqual(["perm_edit_auth_test", "perm_read_auth_test"])
            expect(result.Entities[0]?.id).toBe(entity.id)
            expect(result.Roles).toHaveLength(2)
            return true
        })
    })
})
