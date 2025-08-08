import { createSafeActionClient, DEFAULT_SERVER_ERROR_MESSAGE } from "next-safe-action";

export const actionClient = createSafeActionClient({
    // Can also be an async function.
    handleServerError(e) {
        // Log to console.
        console.error("Action error:", e.name, e.message)

        if (HandleServerError.has(e.name) && "code" in e && typeof e.code === "string") {
            return e.code
        }

        return DEFAULT_SERVER_ERROR_MESSAGE
    },
})

const HandleServerError = new Set(["DeleteRoleUserAssignedError"])