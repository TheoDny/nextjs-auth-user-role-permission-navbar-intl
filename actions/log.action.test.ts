import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { getLogsMock, getSessionMock, headersMock } = vi.hoisted(() => ({
    getLogsMock: vi.fn(),
    getSessionMock: vi.fn(),
    headersMock: vi.fn(async () => ({})),
}))

vi.mock("@/services/log/log.service", () => ({
    getLogs: getLogsMock,
}))

vi.mock("@/lib/auth", () => ({
    auth: {
        api: {
            getSession: getSessionMock,
        },
    },
}))

vi.mock("next/headers", () => ({
    headers: headersMock,
}))

describe("log.action", () => {
    beforeEach(() => {
        vi.spyOn(console, "error").mockImplementation(() => {})
        vi.spyOn(console, "log").mockImplementation(() => {})
        getLogsMock.mockReset()
        getSessionMock.mockReset()
        headersMock.mockClear()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it("returns serverError when user session is missing", async () => {
        const { getLogsAction } = await import("./log.action")
        getSessionMock.mockResolvedValue(null)

        const result = await getLogsAction({})

        expect(result.serverError).toBeTruthy()
        expect(getLogsMock).not.toHaveBeenCalled()
    })

    it("uses default date range when startDate and endDate are omitted", async () => {
        const { getLogsAction } = await import("./log.action")
        getSessionMock.mockResolvedValue({
            user: {
                Entities: [{ id: "e1" }, { id: "e2" }],
            },
        })
        getLogsMock.mockResolvedValue([{ id: "l1" }])

        const result = await getLogsAction({})

        expect(getLogsMock).toHaveBeenCalledTimes(1)
        const [entityIds, startDate, endDate] = getLogsMock.mock.calls[0]
        expect(entityIds).toEqual(["e1", "e2"])
        expect(startDate).toBeInstanceOf(Date)
        expect(endDate).toBeInstanceOf(Date)
        expect(result.data).toEqual([{ id: "l1" }])
    })

    it("passes provided date filters to getLogs", async () => {
        const { getLogsAction } = await import("./log.action")
        getSessionMock.mockResolvedValue({
            user: {
                Entities: [{ id: "e1" }],
            },
        })
        getLogsMock.mockResolvedValue([{ id: "l2" }])

        const result = await getLogsAction({
            startDate: "2026-01-01T00:00:00.000Z",
            endDate: "2026-01-08T00:00:00.000Z",
        })

        expect(getLogsMock).toHaveBeenCalledTimes(1)
        const [entityIds, startDate, endDate] = getLogsMock.mock.calls[0]
        expect(entityIds).toEqual(["e1"])
        expect(startDate.toISOString()).toBe("2026-01-01T00:00:00.000Z")
        expect(endDate.toISOString()).toBe("2026-01-08T00:00:00.000Z")
        expect(result.data).toEqual([{ id: "l2" }])
    })
})
