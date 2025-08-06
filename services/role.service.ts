import { prisma } from "@/lib/prisma"
import {
    addRoleCreateLog,
    addRoleDeleteLog,
    addRoleSetPermissionLog,
    addRoleUpdateLog,
} from "@/services/log.service"
import { revalidatePath } from "next/cache"

// Get all roles with their permissions
export async function getRoles() {
    try {
        const roles = await prisma.role.findMany({
            include: {
                Permissions: true,
            },
            orderBy: {
                name: "asc",
            },
        })

        return roles
    } catch (error) {
        console.error("Failed to fetch roles:", error)
        throw new Error("Failed to fetch roles")
    }
}

// Create a new role
export async function createRole(data: { name: string; description: string }) {
    try {
        const role = await prisma.role.create({
            data: {
                name: data.name,
                description: data.description || "",
            },
            include: {
                Permissions: true,
            },
        })

        // Add log
        addRoleCreateLog({ id: role.id, name: role.name })

        revalidatePath("/administration/roles")
        return role
    } catch (error) {
        console.error("Failed to create role:", error)
        throw new Error("Failed to create role")
    }
}

// Update an existing role
export async function updateRole(id: string, data: { name: string; description: string }) {
    try {
        const role = await prisma.role.update({
            where: { id },
            data: {
                name: data.name,
                description: data.description || "",
            },
            include: {
                Permissions: true,
            },
        })

        // Add log
        addRoleUpdateLog({ id: role.id, name: role.name })

        revalidatePath("/administration/roles")
        return role
    } catch (error) {
        console.error("Failed to update role:", error)
        throw new Error("Failed to update role")
    }
}

// Delete a role
export async function deleteRole(id: string) {
    try {
        // Check if the role is assigned to any users
        const userCount = await prisma.user.count({
            where: {
                Roles: {
                    some: {
                        id,
                    },
                },
            },
        })

        if (userCount > 0) {
            throw new Error("Cannot delete a role that is assigned to users")
        }

        // Get role details for logging before deletion
        const roleToDelete = await prisma.role.findUnique({
            where: { id },
        })

        if (!roleToDelete) {
            throw new Error("Role not found")
        }

        const role = await prisma.role.delete({
            where: { id },
        })

        // Add log
        addRoleDeleteLog({ id: role.id, name: roleToDelete.name })

        revalidatePath("/administration/roles")
        return role
    } catch (error) {
        console.error("Failed to delete role:", error)
        throw new Error("Failed to delete role")
    }
}

// Assign permissions to a role
export async function assignPermissionsToRole(roleId: string, permissionCodes: string[]) {
    try {
        const role = await prisma.role.update({
            where: { id: roleId },
            data: {
                Permissions: {
                    set: permissionCodes.map((code) => ({ code })),
                },
                updatedAt: new Date(),
            },
            include: {
                Permissions: true,
            },
        })

        // Add log
        addRoleSetPermissionLog({ id: role.id, name: role.name })

        revalidatePath("/administration/roles")
        return role
    } catch (error) {
        console.error("Failed to assign permissions:", error)
        throw new Error("Failed to assign permissions")
    }
}
