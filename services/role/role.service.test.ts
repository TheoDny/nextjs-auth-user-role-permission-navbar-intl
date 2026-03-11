import { DeleteRoleUserAssignedError } from "@/errors/DeleteRoleUserAssignedError"
import { prisma } from "@/lib/prisma"
import { withRollbackTransaction } from "@/tests/helpers/prisma-transaction"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { assignPermissionsToRole, createRole, deleteRole, updateRole } from "./role.service"

vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
}))

vi.mock("@/services/log.service", () => ({
    addRoleCreateLog: vi.fn(),
    addRoleDeleteLog: vi.fn(),
    addRoleSetPermissionLog: vi.fn(),
    addRoleUpdateLog: vi.fn(),
}))

describe.sequential("role.service (db transaction)", () => {
    beforeEach(() => {
        vi.spyOn(console, "error").mockImplementation(() => {})
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it("creates and updates a role", async () => {
        await withRollbackTransaction(async () => {
            const created = await createRole({ name: "RoleServiceCreate", description: "desc" })
            const updated = await updateRole(created.id, { name: "RoleServiceUpdated", description: "updated" })

            expect(created.name).toBe("RoleServiceCreate")
            expect(updated.name).toBe("RoleServiceUpdated")
            return true
        })
    })

    it("assigns permissions to a role", async () => {
        await withRollbackTransaction(async () => {
            await prisma.permission.createMany({
                data: [{ code: "perm_role_test_1" }, { code: "perm_role_test_2" }],
                skipDuplicates: true,
            })
            const role = await prisma.role.create({
                data: { name: "RoleAssignPerm", description: "desc" },
            })

            const updated = await assignPermissionsToRole(role.id, ["perm_role_test_1", "perm_role_test_2"])

            expect(updated.Permissions.map((p) => p.code).sort()).toEqual(["perm_role_test_1", "perm_role_test_2"])
            return true
        })
    })

    it("throws when deleting a role assigned to users", async () => {
        await withRollbackTransaction(async () => {
            const entity = await prisma.entity.create({ data: { name: "EntityRoleDelete" } })
            const role = await prisma.role.create({
                data: { name: "RoleDeleteAssigned", description: "desc" },
            })
            await prisma.user.create({
                data: {
                    email: "role-assigned@example.com",
                    name: "RoleAssignedUser",
                    entitySelectedId: entity.id,
                    Entities: { connect: [{ id: entity.id }] },
                    Roles: { connect: [{ id: role.id }] },
                },
            })

            await expect(deleteRole(role.id)).rejects.toBeInstanceOf(DeleteRoleUserAssignedError)
            return true
        })
    })
})
