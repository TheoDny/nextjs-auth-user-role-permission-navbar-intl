"use server"

import { auth } from "@/lib/auth"
import { headers } from "next/headers"

type AuthGuardOptions = {
    requiredPermission?: string 
}

export async function checkAuth(options: AuthGuardOptions = {}) {
    const { requiredPermission } = options

    // Get the session
    const session = await auth.api.getSession({
        headers: await headers(),
    })

    // Check if session exists
    if (!session || !session.user.active) {
        throw new Error("Unauthorized: No active session")
    }

    // If a specific permission is required, check for it
    if (requiredPermission && session.user.Permissions) {
        const hasPermission = session.user.Permissions.some((permission) => permission.code === requiredPermission)

        if (!hasPermission) {
            throw new Error(`Unauthorized: Missing permission ${requiredPermission}`)
        }
    }

    return session
}
