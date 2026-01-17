"use server"

import { checkAuth } from "@/lib/auth-guard"
import { actionClient } from "@/lib/safe-action"
import { roleSuperAdmin } from "@/prisma/data-seed"
import {
    assignPermissionsToRole,
    countRoles,
    createRole,
    deleteRole,
    getRoles,
    updateRole,
} from "@/services/role.service"
import { z } from "zod"

// Schema for creating a role
const createRoleSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Name must be at least 2 characters")
        .max(64, "Name must be at most 64 characters"),
    description: z.string().trim().max(255, "Description must be at most 255 characters"),
})

// Schema for updating a role
const updateRoleSchema = z.object({
    id: z.string().trim(),
    name: z
        .string()
        .trim()
        .min(2, "Name must be at least 2 characters")
        .max(64, "Name must be at most 64 characters"),
    description: z.string().trim().max(255, "Description must be at most 255 characters"),
})

// Schema for deleting a role
const deleteRoleSchema = z.object({
    id: z.string().trim(),
})

// Schema for assigning permissions to a role
const assignPermissionsSchema = z.object({
    roleId: z.string(),
    permissionCodes: z.array(z.string()),
})

// Get all roles with their permissions
export async function getRolesAction() {
    try {
        // Auth check without permission requirement for read operations
        await checkAuth()

        return await getRoles()
    } catch (error) {
        console.error("Failed to fetch roles:", error)
        throw new Error("Failed to fetch roles")
    }
}

// Create a new role
export const createRoleAction = actionClient.inputSchema(createRoleSchema).action(async ({ parsedInput }) => {
    try {
        // Check for role_create permission
        await checkAuth({ requiredPermission: "role_create" })

        // Check role limit if NEXT_PUBLIC_MAX_ROLE is defined
        if (process.env.NEXT_PUBLIC_MAX_ROLE) {
            const maxRoles = parseInt(process.env.NEXT_PUBLIC_MAX_ROLE)
            const currentRoleCount = await countRoles()

            if (currentRoleCount >= maxRoles) {
                throw new Error(`Maximum number of roles reached (${maxRoles})`)
            }
        }

        return await createRole({
            ...parsedInput,
        })
    } catch (error) {
        console.error("Failed to create role:", error)
        throw new Error("Failed to create role")
    }
})

// Update an existing role
export const updateRoleAction = actionClient.inputSchema(updateRoleSchema).action(async ({ parsedInput }) => {
    try {
        // Check for role_edit permission
        await checkAuth({ requiredPermission: "role_edit" })

        return await updateRole(parsedInput.id, {
            name: parsedInput.name,
            description: parsedInput.description,
        })
    } catch (error) {
        console.error("Failed to update role:", error)
        throw new Error("Failed to update role")
    }
})

// Delete a role
export const deleteRoleAction = actionClient.inputSchema(deleteRoleSchema).action(async ({ parsedInput }) => {
    // Check for role_create permission (same as creation for deletion)
    await checkAuth({ requiredPermission: "role_create" })

    // Check if it's the Super Admin role
    if (parsedInput.id === roleSuperAdmin.id) {
        throw new Error("Cannot delete the Super Admin role")
    }

    return await deleteRole(parsedInput.id)
})

// Assign permissions to a role
export const assignPermissionsToRoleAction = actionClient
    .schema(assignPermissionsSchema)
    .action(async ({ parsedInput: { roleId, permissionCodes } }) => {
        try {
            // Check for role_edit permission
            await checkAuth({ requiredPermission: "role_edit" })

            return await assignPermissionsToRole(roleId, permissionCodes)
        } catch (error) {
            console.error("Failed to assign permissions:", error)
            throw new Error("Failed to assign permissions")
        }
    })
