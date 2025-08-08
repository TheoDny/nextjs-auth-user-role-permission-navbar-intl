import { DeleteRoleUserAssignedError } from "@/errors/DeleteRoleUserAssignedError"
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
        // Check if it's the Super Admin role
        const existingRole = await prisma.role.findUnique({
            where: { id },
        })

        if (existingRole?.name === "Super Admin") {
            throw new Error("Cannot modify the Super Admin role")
        }

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
    // Get role details first
    const roleToDelete = await prisma.role.findUnique({
        where: { id },
    })

    if (!roleToDelete) {
        throw new Error("Role not found")
    }

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
        throw new DeleteRoleUserAssignedError("Cannot delete a role that is assigned to users")
    }

    const role = await prisma.role.delete({
        where: { id },
    })

    // Add log
    addRoleDeleteLog({ id: role.id, name: roleToDelete.name })

    revalidatePath("/administration/roles")
    return role
}

// Assign permissions to a role
export async function assignPermissionsToRole(roleId: string, permissionCodes: string[]) {
    try {
        // Check if it's the Super Admin role
        const existingRole = await prisma.role.findUnique({
            where: { id: roleId },
        })

        if (existingRole?.name === "Super Admin") {
            throw new Error("Cannot modify permissions for the Super Admin role")
        }

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

export async function countRoles() {
    return await prisma.role.count()
}
