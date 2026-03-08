"use server"

import { UnauthorizedMissingPermissionError } from "@/errors/UnauthorizedMissingPermission"
import { UnauthorizedNoSessionError } from "@/errors/UnauthorizedNoSessionError"
import { UnauthorizedUserInactiveError } from "@/errors/UnauthorizedUserInactiveError"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

type AuthGuardOptions = {
    requiredPermission?: string
}

export async function checkAuth(options: AuthGuardOptions = {}) {
    const { requiredPermission } = options

    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) {
        throw new UnauthorizedNoSessionError()
    }
    if (!session.user.active) {
        throw new UnauthorizedUserInactiveError(session.user.name)
    }

    // If a specific permission is required, check for it
    if (requiredPermission) {
        const hasPermission = session.user.Permissions.some((permission) => permission.code === requiredPermission)

        if (!hasPermission) {
            throw new UnauthorizedMissingPermissionError(requiredPermission)
        }
    }

    return session
}

export async function pageCheckAuth(options: AuthGuardOptions = {}) {
    const { requiredPermission } = options

    const session = await auth.api.getSession({
        headers: await headers(),
    })

    if (!session) {
        return redirect("/sign-in")
    }
    if (!session.user.active) {
        return redirect(`/unauthorized?type=userInactive&userName=${session.user.name}`)
    }

    // If a specific permission is required, check for it
    if (requiredPermission) {
        const hasPermission = session.user.Permissions.some((permission) => permission.code === requiredPermission)

        if (!hasPermission) {
            return redirect(`/unauthorized?type=missingPermission&permission=${requiredPermission}`)
        }
    }

    return session
}
