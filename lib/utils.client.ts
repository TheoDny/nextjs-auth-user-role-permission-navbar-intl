import type { SafeActionResult } from "next-safe-action"

type TranslationLike = {
    (key: string): string
    has?: (key: string) => boolean
}

type ServerErrorWithName = {
    errorName?: string
}

export type HandleSafeActionToast = {
    error: (message: string) => void
    t?: TranslationLike
    errorKeyPrefix?: string
    fallbackErrorMessage: string
    validationErrorMessage?: string
    noDataErrorMessage?: string
}

export type HandleSafeActionResultFailureReason = "server-error" | "validation-error" | "no-data"

export type HandleSafeActionResultFailure = {
    ok: false
    reason: HandleSafeActionResultFailureReason
}

export type HandleSafeActionResultSuccess<TData> = {
    ok: true
    data: TData
}

function getSafeActionErrorName(serverError: unknown): string | undefined {
    if (typeof serverError !== "object" || serverError === null) return
    if (!("errorName" in serverError)) return
    const { errorName } = serverError as ServerErrorWithName
    return typeof errorName === "string" && errorName.length > 0 ? errorName : undefined
}

function getServerErrorMessage(serverError: unknown, toast?: HandleSafeActionToast): string {
    const fallbackErrorMessage = toast?.fallbackErrorMessage ?? "An unexpected error occurred"
    const errorName = getSafeActionErrorName(serverError)

    if (errorName && toast?.t) {
        const errorKey = `${toast.errorKeyPrefix ?? ""}${errorName}`
        const translationExists = typeof toast.t.has === "function" ? toast.t.has(errorKey) : true
        if (translationExists) return toast.t(errorKey)
    }

    if (typeof serverError === "string" && serverError.length > 0) return serverError
    if (errorName) return errorName

    return fallbackErrorMessage
}

/**
 * Normalizes next-safe-action result handling:
 * - clear console logs for every branch
 * - optional toast notification
 * - translated message when serverError contains SafeHandleActionError `errorName`
 */
export function handleSafeActionResult<TData, TServerError = unknown, TVE = unknown>(
    result: SafeActionResult<TServerError, undefined, TVE, TData> | undefined,
    toast?: HandleSafeActionToast,
): HandleSafeActionResultSuccess<TData> | HandleSafeActionResultFailure {
    if (result?.serverError) {
        const message = getServerErrorMessage(result.serverError, toast)
        console.error("serverError", {
            serverError: result.serverError,
            message,
        })
        toast?.error(message)
        return { ok: false, reason: "server-error" }
    }

    if (result?.validationErrors) {
        console.error("validationErrors", result.validationErrors)
        toast?.error(toast.validationErrorMessage ?? toast.fallbackErrorMessage)
        return { ok: false, reason: "validation-error" }
    }

    if (!result?.data) {
        console.error("no data returned")
        toast?.error(toast.noDataErrorMessage ?? toast.fallbackErrorMessage)
        return { ok: false, reason: "no-data" }
    }

    return { ok: true, data: result.data }
}
