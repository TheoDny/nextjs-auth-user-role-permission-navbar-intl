import { createSafeActionClient, DEFAULT_SERVER_ERROR_MESSAGE } from "next-safe-action";

export const actionClient = createSafeActionClient({
    // Can also be an async function.
    handleServerError(e) {
    // Log to console.
        console.error("Action error:", e.message);

        return DEFAULT_SERVER_ERROR_MESSAGE;
    },
});