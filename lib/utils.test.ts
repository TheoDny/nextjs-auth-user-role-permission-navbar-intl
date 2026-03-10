import { NoEditSuperAdminRole } from "@/errors/NoEditSuperAdminRole"
import { NoEditSuperAdminUser } from "@/errors/NoEditSuperAdminUser"
import { roleSuperAdmin, userSuperAdmin } from "@/prisma/data-seed"
import { afterEach, describe, expect, it, vi } from "vitest"
import { assertNotSuperAdminRoleId, assertNotSuperAdminUserId, generateInviteToken } from "./utils"

describe("utils", () => {
    afterEach(() => {
        vi.unstubAllEnvs()
    })

    it("generateInviteToken throws when JWT_SECRET is missing", () => {
        vi.stubEnv("JWT_SECRET", "")

        expect(() => generateInviteToken("John", "john@example.com", new Date())).toThrow(
            "JWT_SECRET is required in configuration server"
        )
    })

    it("generateInviteToken returns a string token when JWT_SECRET is set", () => {
        vi.stubEnv("JWT_SECRET", "test-secret")

        const token = generateInviteToken("John", "john@example.com", new Date(Date.now() + 60_000))

        expect(typeof token).toBe("string")
        expect(token.length).toBeGreaterThan(10)
    })

    it("assertNotSuperAdminUserId throws for super admin user id", () => {
        expect(() => assertNotSuperAdminUserId(userSuperAdmin.id)).toThrow(NoEditSuperAdminUser)
    })

    it("assertNotSuperAdminRoleId throws for super admin role id", () => {
        expect(() => assertNotSuperAdminRoleId(roleSuperAdmin.id)).toThrow(NoEditSuperAdminRole)
    })
})
