import { DeleteRoleUserAssignedError } from "@/errors/DeleteRoleUserAssignedError"
import { RoleNotFound } from "@/errors/RoleNotFound"
import { prisma } from "@/lib/prisma"
import { assertNotSuperAdminRoleId } from "@/lib/utils"
import {
    addRoleCreateLog,
    addRoleDeleteLog,
    addRoleSetPermissionLog,
    addRoleUpdateLog,
} from "@/services/log/log.service"
import { revalidatePath } from "next/cache"

// Get all roles with their permissions
export async function getRoles() {
    const roles = await prisma.role.findMany({
        include: {
            Permissions: true,
        },
        orderBy: {
            name: "asc",
        },
    })

    return roles
}

// Create a new role
export async function createRole(data: { name: string; description: string }) {
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
}

// Update an existing role
export async function updateRole(id: string, data: { name: string; description: string }) {
    assertNotSuperAdminRoleId(id)

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
}

// Delete a role
export async function deleteRole(id: string) {
    assertNotSuperAdminRoleId(id)

    // Get role details first
    const roleToDelete = await prisma.role.findUnique({
        where: { id },
    })

    if (!roleToDelete) {
        throw new RoleNotFound()
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
        throw new DeleteRoleUserAssignedError()
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
    assertNotSuperAdminRoleId(roleId)

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
}

export async function countRoles() {
    return await prisma.role.count()
}
