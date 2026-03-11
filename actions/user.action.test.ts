import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const {
    changeEntitySelectedMock,
    checkAuthMock,
    checkTokenMock,
    countUsersMock,
    createUserMock,
    deleteUserMock,
    getUsersMock,
    signUpUserMock,
    updateUserMock,
} = vi.hoisted(() => ({
    checkAuthMock: vi.fn(),
    checkTokenMock: vi.fn(),
    countUsersMock: vi.fn(),
    createUserMock: vi.fn(),
    deleteUserMock: vi.fn(),
    getUsersMock: vi.fn(),
    signUpUserMock: vi.fn(),
    updateUserMock: vi.fn(),
    changeEntitySelectedMock: vi.fn(),
}))

vi.mock("@/services/auth/auth.service", () => ({
    checkToken: checkTokenMock,
}))

vi.mock("@/services/user/user.service", () => ({
    assignRolesToUser: vi.fn(),
    changeEntitySelected: changeEntitySelectedMock,
    countUsers: countUsersMock,
    createUser: createUserMock,
    deleteUser: deleteUserMock,
    getUsers: getUsersMock,
    signUpUser: signUpUserMock,
    updateUser: updateUserMock,
    updateUserProfile: vi.fn(),
}))

vi.mock("@/lib/auth", () => ({
    auth: {
        api: {
            getSession: vi.fn(),
        },
    },
}))

vi.mock("@/lib/auth-guard", () => ({
    checkAuth: checkAuthMock,
}))

vi.mock("next/cache", () => ({
    revalidatePath: vi.fn(),
}))

vi.mock("next/headers", () => ({
    headers: vi.fn(),
}))

describe("signUpAction", () => {
    beforeEach(() => {
        vi.spyOn(console, "error").mockImplementation(() => {})
        vi.spyOn(console, "log").mockImplementation(() => {})
        checkAuthMock.mockReset()
        checkTokenMock.mockReset()
        countUsersMock.mockReset()
        createUserMock.mockReset()
        deleteUserMock.mockReset()
        getUsersMock.mockReset()
        signUpUserMock.mockReset()
        updateUserMock.mockReset()
        changeEntitySelectedMock.mockReset()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it("returns PasswordsMatchingError when passwords differ", async () => {
        const { signUpAction } = await import("./user.action")

        const result = await signUpAction({
            email: "admin@admin.com",
            password: "Admin0123456789!",
            passwordConfirmation: "Different0123456789!",
            token: "token",
        })

        expect(result.serverError).toEqual({ errorName: "PasswordsMatchingError" })
        expect(checkTokenMock).not.toHaveBeenCalled()
        expect(signUpUserMock).not.toHaveBeenCalled()
    })

    it("returns TokenInvalidError when token check fails", async () => {
        const { signUpAction } = await import("./user.action")
        checkTokenMock.mockResolvedValue(false)

        const result = await signUpAction({
            email: "admin@admin.com",
            password: "Admin0123456789!",
            passwordConfirmation: "Admin0123456789!",
            token: "token",
        })

        expect(checkTokenMock).toHaveBeenCalledWith("token", "admin@admin.com")
        expect(result.serverError).toEqual({ errorName: "TokenInvalidError" })
        expect(signUpUserMock).not.toHaveBeenCalled()
    })

    it("returns data when token is valid and signup succeeds", async () => {
        const { signUpAction } = await import("./user.action")
        checkTokenMock.mockResolvedValue({
            name: "Admin",
            email: "admin@admin.com",
        })
        signUpUserMock.mockResolvedValue(true)

        const result = await signUpAction({
            email: "admin@admin.com",
            password: "Admin0123456789!",
            passwordConfirmation: "Admin0123456789!",
            token: "token",
        })

        expect(checkTokenMock).toHaveBeenCalledWith("token", "admin@admin.com")
        expect(signUpUserMock).toHaveBeenCalledWith("Admin", "admin@admin.com", "Admin0123456789!")
        expect(result.data).toBe(true)
    })
})

describe("other user actions", () => {
    beforeEach(() => {
        vi.spyOn(console, "error").mockImplementation(() => {})
        vi.spyOn(console, "log").mockImplementation(() => {})
        checkAuthMock.mockReset()
        countUsersMock.mockReset()
        createUserMock.mockReset()
        deleteUserMock.mockReset()
        getUsersMock.mockReset()
        updateUserMock.mockReset()
    })

    afterEach(() => {
        delete process.env.NEXT_PUBLIC_MAX_USER
        vi.restoreAllMocks()
    })

    it("getUsersAction returns users when auth passes", async () => {
        const { getUsersAction } = await import("./user.action")
        getUsersMock.mockResolvedValue([{ id: "u1", name: "Jane" }])

        const result = await getUsersAction()

        expect(checkAuthMock).toHaveBeenCalledWith()
        expect(result).toEqual([{ id: "u1", name: "Jane" }])
    })

    it("createUserAction blocks when max users is reached", async () => {
        const { createUserAction } = await import("./user.action")
        process.env.NEXT_PUBLIC_MAX_USER = "1"
        countUsersMock.mockResolvedValue(1)

        const result = await createUserAction({
            name: "Jane Doe",
            email: "jane@example.com",
            active: true,
            entities: ["e1"],
        })

        expect(checkAuthMock).toHaveBeenCalledWith({ requiredPermission: "user_create" })
        expect(countUsersMock).toHaveBeenCalledTimes(1)
        expect(createUserMock).not.toHaveBeenCalled()
        expect(result.serverError).toBeTruthy()
    })

    it("deleteUserAction rejects deleting current user", async () => {
        const { deleteUserAction } = await import("./user.action")
        checkAuthMock.mockResolvedValue({ user: { id: "u2" } })

        const result = await deleteUserAction({ id: "u2" })

        expect(checkAuthMock).toHaveBeenCalledWith({ requiredPermission: "user_create" })
        expect(deleteUserMock).not.toHaveBeenCalled()
        expect(result.serverError).toBeTruthy()
    })
})
