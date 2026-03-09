import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { handleSafeActionResult } from "./utils.client"

describe("handleSafeActionResult", () => {
    beforeEach(() => {
        vi.spyOn(console, "error").mockImplementation(() => {})
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it("returns success when data is present", () => {
        const errorSpy = vi.fn()
        const result = handleSafeActionResult<{ id: string }>(
            {
                data: { id: "u_1" },
            },
            {
                error: errorSpy,
                fallbackErrorMessage: "fallback",
            }
        )

        expect(result).toEqual({ ok: true, data: { id: "u_1" } })
        expect(errorSpy).not.toHaveBeenCalled()
    })

    it("uses translated message when server error has errorName", () => {
        const errorSpy = vi.fn()
        const t = ((key: string) => `translated:${key}`) as ((key: string) => string) & {
            has: (key: string) => boolean
        }
        t.has = () => true

        const result = handleSafeActionResult(
            {
                serverError: { errorName: "TokenInvalidError" },
            },
            {
                error: errorSpy,
                t,
                errorKeyPrefix: "error.",
                fallbackErrorMessage: "fallback",
            }
        )

        expect(result).toEqual({ ok: false, reason: "server-error" })
        expect(errorSpy).toHaveBeenCalledWith("translated:error.TokenInvalidError")
    })

    it("uses validation fallback message for validation errors", () => {
        const errorSpy = vi.fn()

        const result = handleSafeActionResult(
            {
                validationErrors: { _errors: ["invalid"] },
            },
            {
                error: errorSpy,
                fallbackErrorMessage: "fallback",
                validationErrorMessage: "validation-failed",
            }
        )

        expect(result).toEqual({ ok: false, reason: "validation-error" })
        expect(errorSpy).toHaveBeenCalledWith("validation-failed")
    })

    it("returns no-data when action returns no payload", () => {
        const errorSpy = vi.fn()

        const result = handleSafeActionResult(
            {
                data: undefined,
            },
            {
                error: errorSpy,
                fallbackErrorMessage: "fallback",
                noDataErrorMessage: "missing-data",
            }
        )

        expect(result).toEqual({ ok: false, reason: "no-data" })
        expect(errorSpy).toHaveBeenCalledWith("missing-data")
    })
})
