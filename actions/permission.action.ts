"use server"

import { checkAuth } from "@/lib/auth-guard"
import { getPermissions } from "@/services/permission.service"

// Get all permissions
export async function getPermissionsAction() {
    try {
        // Basic auth check
        await checkAuth()

        return await getPermissions()
    } catch (error) {
        console.error("Failed to fetch permissions:", error)
        throw new Error("Failed to fetch permissions")
    }
}

