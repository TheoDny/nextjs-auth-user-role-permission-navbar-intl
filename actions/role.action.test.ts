import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const {
    assignPermissionsToRoleMock,
    checkAuthMock,
    countRolesMock,
    createRoleMock,
    deleteRoleMock,
    getRolesMock,
    updateRoleMock,
} = vi.hoisted(() => ({
    checkAuthMock: vi.fn(),
    getRolesMock: vi.fn(),
    countRolesMock: vi.fn(),
    createRoleMock: vi.fn(),
    updateRoleMock: vi.fn(),
    deleteRoleMock: vi.fn(),
    assignPermissionsToRoleMock: vi.fn(),
}))

vi.mock("@/lib/auth-guard", () => ({
    checkAuth: checkAuthMock,
}))

vi.mock("@/services/role/role.service", () => ({
    assignPermissionsToRole: assignPermissionsToRoleMock,
    countRoles: countRolesMock,
    createRole: createRoleMock,
    deleteRole: deleteRoleMock,
    getRoles: getRolesMock,
    updateRole: updateRoleMock,
}))

describe("role.action", () => {
    beforeEach(() => {
        vi.spyOn(console, "error").mockImplementation(() => {})
        vi.spyOn(console, "log").mockImplementation(() => {})
        checkAuthMock.mockReset()
        getRolesMock.mockReset()
        countRolesMock.mockReset()
        createRoleMock.mockReset()
        updateRoleMock.mockReset()
        deleteRoleMock.mockReset()
        assignPermissionsToRoleMock.mockReset()
    })

    afterEach(() => {
        delete process.env.NEXT_PUBLIC_MAX_ROLE
        vi.restoreAllMocks()
    })

    it("getRolesAction returns roles", async () => {
        const { getRolesAction } = await import("./role.action")
        getRolesMock.mockResolvedValue([{ id: "r1", name: "Manager" }])

        const result = await getRolesAction()

        expect(checkAuthMock).toHaveBeenCalledWith()
        expect(result).toEqual([{ id: "r1", name: "Manager" }])
    })

    it("createRoleAction blocks when max roles reached", async () => {
        const { createRoleAction } = await import("./role.action")
        process.env.NEXT_PUBLIC_MAX_ROLE = "1"
        countRolesMock.mockResolvedValue(1)

        const result = await createRoleAction({
            name: "Manager",
            description: "desc",
        })

        expect(checkAuthMock).toHaveBeenCalledWith({ requiredPermission: "role_create" })
        expect(countRolesMock).toHaveBeenCalledTimes(1)
        expect(createRoleMock).not.toHaveBeenCalled()
        expect(result.serverError).toBeTruthy()
    })

    it("createRoleAction creates role when under max limit", async () => {
        const { createRoleAction } = await import("./role.action")
        process.env.NEXT_PUBLIC_MAX_ROLE = "5"
        countRolesMock.mockResolvedValue(1)
        createRoleMock.mockResolvedValue({ id: "r1", name: "Manager", description: "desc" })

        const result = await createRoleAction({
            name: "Manager",
            description: "desc",
        })

        expect(checkAuthMock).toHaveBeenCalledWith({ requiredPermission: "role_create" })
        expect(createRoleMock).toHaveBeenCalledWith({ name: "Manager", description: "desc" })
        expect(result.data).toEqual({ id: "r1", name: "Manager", description: "desc" })
    })

    it("updateRoleAction calls service with role_edit permission", async () => {
        const { updateRoleAction } = await import("./role.action")
        updateRoleMock.mockResolvedValue({ id: "r1", name: "Manager", description: "updated" })

        const result = await updateRoleAction({
            id: "r1",
            name: "Manager",
            description: "updated",
        })

        expect(checkAuthMock).toHaveBeenCalledWith({ requiredPermission: "role_edit" })
        expect(updateRoleMock).toHaveBeenCalledWith("r1", {
            name: "Manager",
            description: "updated",
        })
        expect(result.data).toEqual({ id: "r1", name: "Manager", description: "updated" })
    })

    it("deleteRoleAction calls service with role_create permission", async () => {
        const { deleteRoleAction } = await import("./role.action")
        deleteRoleMock.mockResolvedValue({ id: "r1" })

        const result = await deleteRoleAction({ id: "r1" })

        expect(checkAuthMock).toHaveBeenCalledWith({ requiredPermission: "role_create" })
        expect(deleteRoleMock).toHaveBeenCalledWith("r1")
        expect(result.data).toEqual({ id: "r1" })
    })

    it("assignPermissionsToRoleAction calls service with role_edit permission", async () => {
        const { assignPermissionsToRoleAction } = await import("./role.action")
        assignPermissionsToRoleMock.mockResolvedValue({ id: "r1" })

        const result = await assignPermissionsToRoleAction({
            roleId: "r1",
            permissionCodes: ["user_read", "role_edit"],
        })

        expect(checkAuthMock).toHaveBeenCalledWith({ requiredPermission: "role_edit" })
        expect(assignPermissionsToRoleMock).toHaveBeenCalledWith("r1", ["user_read", "role_edit"])
        expect(result.data).toEqual({ id: "r1" })
    })
})
