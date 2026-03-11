import { SafeHandleActionError } from "@/errors/SafeHandleActionError"
import { createSafeActionClient, DEFAULT_SERVER_ERROR_MESSAGE } from "next-safe-action"

export const actionClient = createSafeActionClient({
    // Can also be an async function.
    handleServerError(e) {
        // Log to console.
        console.error("Action error:", e.name, e.message)

        if (e instanceof SafeHandleActionError) {
            return { errorName: e.name }
        }

        return DEFAULT_SERVER_ERROR_MESSAGE
    },
})
