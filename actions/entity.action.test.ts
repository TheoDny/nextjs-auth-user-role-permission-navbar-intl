import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const {
    checkAuthMock,
    countEntitiesMock,
    createEntityMock,
    deleteEntityMock,
    getEntitiesMock,
    updateEntityMock,
} = vi.hoisted(() => ({
    checkAuthMock: vi.fn(),
    countEntitiesMock: vi.fn(),
    createEntityMock: vi.fn(),
    updateEntityMock: vi.fn(),
    deleteEntityMock: vi.fn(),
    getEntitiesMock: vi.fn(),
}))

vi.mock("@/lib/auth-guard", () => ({
    checkAuth: checkAuthMock,
}))

vi.mock("@/services/entity/entity.service", () => ({
    countEntities: countEntitiesMock,
    createEntity: createEntityMock,
    updateEntity: updateEntityMock,
    deleteEntity: deleteEntityMock,
    getEntities: getEntitiesMock,
}))

describe("entity.action", () => {
    beforeEach(() => {
        vi.spyOn(console, "error").mockImplementation(() => {})
        checkAuthMock.mockReset()
        countEntitiesMock.mockReset()
        createEntityMock.mockReset()
        updateEntityMock.mockReset()
        deleteEntityMock.mockReset()
        getEntitiesMock.mockReset()
    })

    afterEach(() => {
        delete process.env.NEXT_PUBLIC_MAX_ENTITY
        vi.restoreAllMocks()
    })

    it("getEntitiesAction returns entities", async () => {
        const { getEntitiesAction } = await import("./entity.action")
        getEntitiesMock.mockResolvedValue([{ id: "e1", name: "Entity A" }])
        checkAuthMock.mockResolvedValue({ user: { id: "u1" } })

        const result = await getEntitiesAction()

        expect(checkAuthMock).toHaveBeenCalledWith({ requiredPermission: "entity_read" })
        expect(getEntitiesMock).toHaveBeenCalledWith("u1")
        expect(result).toEqual([{ id: "e1", name: "Entity A" }])
    })

    it("createEntityAction calls service with entity_create permission", async () => {
        const { createEntityAction } = await import("./entity.action")
        createEntityMock.mockResolvedValue({ id: "e1", name: "Entity A" })
        checkAuthMock.mockResolvedValue({ user: { id: "u1" } })
        countEntitiesMock.mockResolvedValue(0)

        const result = await createEntityAction({ name: "Entity A" })

        expect(checkAuthMock).toHaveBeenCalledWith({ requiredPermission: "entity_create" })
        expect(createEntityMock).toHaveBeenCalledWith({ name: "Entity A", creatorUserId: "u1" })
        expect(result.data).toEqual({ id: "e1", name: "Entity A" })
    })

    it("createEntityAction blocks when max entities reached", async () => {
        const { createEntityAction } = await import("./entity.action")
        process.env.NEXT_PUBLIC_MAX_ENTITY = "1"
        checkAuthMock.mockResolvedValue({ user: { id: "u1" } })
        countEntitiesMock.mockResolvedValue(1)

        const result = await createEntityAction({ name: "Entity A" })

        expect(checkAuthMock).toHaveBeenCalledWith({ requiredPermission: "entity_create" })
        expect(countEntitiesMock).toHaveBeenCalledTimes(1)
        expect(createEntityMock).not.toHaveBeenCalled()
        expect(result.serverError).toBeTruthy()
    })

    it("updateEntityAction calls service with entity_edit permission", async () => {
        const { updateEntityAction } = await import("./entity.action")
        updateEntityMock.mockResolvedValue({ id: "e1", name: "Entity Updated" })
        checkAuthMock.mockResolvedValue({ user: { id: "u1" } })

        const result = await updateEntityAction({ id: "e1", name: "Entity Updated" })

        expect(checkAuthMock).toHaveBeenCalledWith({ requiredPermission: "entity_edit" })
        expect(updateEntityMock).toHaveBeenCalledWith("e1", { name: "Entity Updated", userId: "u1" })
        expect(result.data).toEqual({ id: "e1", name: "Entity Updated" })
    })

    it("deleteEntityAction calls service with entity_create permission", async () => {
        const { deleteEntityAction } = await import("./entity.action")
        deleteEntityMock.mockResolvedValue({ id: "e1" })
        checkAuthMock.mockResolvedValue({ user: { id: "u1" } })

        const result = await deleteEntityAction({ id: "e1" })

        expect(checkAuthMock).toHaveBeenCalledWith({ requiredPermission: "entity_create" })
        expect(deleteEntityMock).toHaveBeenCalledWith("e1", "u1")
        expect(result.data).toEqual({ id: "e1" })
    })
})

