import { UnauthorizedMissingPermissionError } from "@/errors/UnauthorizedMissingPermission"
import { UnauthorizedNoSessionError } from "@/errors/UnauthorizedNoSessionError"
import { UnauthorizedUserInactiveError } from "@/errors/UnauthorizedUserInactiveError"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { checkAuth, pageCheckAuth } from "./auth-guard"

const { getSessionMock, redirectMock, headersMock } = vi.hoisted(() => ({
    getSessionMock: vi.fn(),
    redirectMock: vi.fn((url: string) => `redirect:${url}`),
    headersMock: vi.fn(async () => ({})),
}))

vi.mock("@/lib/auth", () => ({
    auth: {
        api: {
            getSession: getSessionMock,
        },
    },
}))

vi.mock("next/navigation", () => ({
    redirect: redirectMock,
}))

vi.mock("next/headers", () => ({
    headers: headersMock,
}))

describe("auth-guard", () => {
    beforeEach(() => {
        getSessionMock.mockReset()
        redirectMock.mockClear()
        headersMock.mockClear()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it("checkAuth throws UnauthorizedNoSessionError when no session", async () => {
        getSessionMock.mockResolvedValue(null)

        await expect(checkAuth()).rejects.toBeInstanceOf(UnauthorizedNoSessionError)
    })

    it("checkAuth throws UnauthorizedUserInactiveError when user is inactive", async () => {
        getSessionMock.mockResolvedValue({
            user: { active: false, name: "John", Permissions: [] },
        })

        await expect(checkAuth()).rejects.toBeInstanceOf(UnauthorizedUserInactiveError)
    })

    it("checkAuth throws UnauthorizedMissingPermissionError when missing permission", async () => {
        getSessionMock.mockResolvedValue({
            user: { active: true, name: "John", Permissions: [{ code: "user_read" }] },
        })

        await expect(checkAuth({ requiredPermission: "role_edit" })).rejects.toBeInstanceOf(
            UnauthorizedMissingPermissionError
        )
    })

    it("checkAuth returns session when user is authorized", async () => {
        const session = {
            user: { active: true, name: "John", Permissions: [{ code: "user_read" }] },
        }
        getSessionMock.mockResolvedValue(session)

        await expect(checkAuth({ requiredPermission: "user_read" })).resolves.toEqual(session)
    })

    it("pageCheckAuth redirects to sign-in when no session", async () => {
        getSessionMock.mockResolvedValue(null)

        const result = await pageCheckAuth()

        expect(result).toBe("redirect:/sign-in")
        expect(redirectMock).toHaveBeenCalledWith("/sign-in")
    })

    it("pageCheckAuth redirects to unauthorized when permission is missing", async () => {
        getSessionMock.mockResolvedValue({
            user: { active: true, name: "John", Permissions: [{ code: "user_read" }] },
        })

        const result = await pageCheckAuth({ requiredPermission: "role_edit" })

        expect(result).toBe("redirect:/unauthorized?type=missingPermission&permission=role_edit")
    })
})
