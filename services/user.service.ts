import { NeedEntityAttributedError } from "@/errors/NeedEntityAttributed"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { assertNotSuperAdminUserId } from "@/lib/utils"
import {
    addUserCreateLog,
    addUserDisableLog,
    addUserEmailVerifiedLog,
    addUserSetEntityLog,
    addUserSetRoleLog,
    addUserUpdateLog,
} from "@/services/log.service"
import { revalidatePath } from "next/cache"
import { createTokenUser } from "./auth.service"
import { sendInvitationSignUp } from "./mail.service"

// Get all users with their roles and entities
export async function getUsers() {
    try {
        const users = await prisma.user.findMany({
            where: {
                deletedAt: null,
            },
            include: {
                Roles: true,
                Entities: true,
            },
            orderBy: {
                name: "asc",
            },
        })

        return users
    } catch (error) {
        console.error("Failed to fetch users:", error)
        throw new Error("Failed to fetch users")
    }
}

// Create a new user
export async function createUser(data: { name: string; email: string; active: boolean; entities: string[] }) {
    if (!data.entities[0]) {
        throw new NeedEntityAttributedError()
    }
    const user = await prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            active: data.active,
            entitySelectedId: data.entities[0], // Set the first entity as selected
            Entities: {
                connect: data.entities.map((entityId) => ({ id: entityId })),
            },
        },
        include: {
            Roles: true,
            Entities: true,
        },
    })

    const tokenUser = await createTokenUser(user.name as string, user.email)
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/sign-up?token=${tokenUser.token}`
    const resMail = await sendInvitationSignUp(user.name as string, user.email, inviteLink)
    if (resMail === false) {
        await prisma.user.delete({
            where: { id: user.id },
        })
        throw new Error("Failed to send invitation email, user deleted")
    }

    // Add log
    addUserCreateLog({ name: user.name || "", id: user.id })

    revalidatePath("/administration/users")
    return user
}

// Update an existing user
export async function updateUser(
    id: string,
    data: {
        name: string
        email: string
        active: boolean
        entitiesToAdd: string[]
        entitiesToRemove: string[]
    },
) {
    assertNotSuperAdminUserId(id)

    const existingUser = await prisma.user.findFirst({
        where: {
            email: data.email,
            id: {
                not: id,
            },
        },
    })

    if (existingUser) {
        throw new Error("Email is already in use by another account")
    }

    const user = await prisma.user.update({
        where: { id },
        data: {
            name: data.name,
            email: data.email,
            active: data.active,
            Entities: {
                connect: data.entitiesToAdd.map((entityId) => ({ id: entityId })),
                disconnect: data.entitiesToRemove.map((entityId) => ({ id: entityId })),
            },
        },
        include: {
            Roles: true,
            Entities: true,
        },
    })

    // Add log
    addUserUpdateLog({ id: user.id, name: user.name || "" })

    // If user active status changed to false, add disable log
    if (data.active === false) {
        addUserDisableLog({ id: user.id, name: user.name || "" })
    }

    revalidatePath("/administration/users")
    return user
}

// Assign roles to a user
export async function assignRolesToUser(userId: string, roleIds: string[]) {
    assertNotSuperAdminUserId(userId)

    const user = await prisma.user.update({
        where: { id: userId },
        data: {
            Roles: {
                set: roleIds.map((id) => ({ id })),
            },
        },
        include: {
            Roles: true,
        },
    })

    // Add log
    addUserSetRoleLog({ id: user.id, name: user.name || "" })

    revalidatePath("/administration/users")
    return user
}

/**
 * Updates a user's profile information (name, email, and image)
 * @param userId The ID of the user to update
 * @param profileData Object containing the profile data to update
 * @returns The updated user object
 */
export async function updateUserProfile(
    userId: string,
    profileData: {
        name: string
        email: string
        image?: string
    },
) {
    // Check if the email is already in use by a different user
    if (profileData.email) {
        const existingUser = await prisma.user.findFirst({
            where: {
                email: profileData.email,
                id: {
                    not: userId,
                },
            },
        })

        if (existingUser) {
            throw new Error("Email is already in use by another account")
        }
    }

    // Update the user's profile
    const updatedUser = await prisma.user.update({
        where: {
            id: userId,
        },
        data: {
            name: profileData.name,
            email: profileData.email,
            image: profileData.image,
        },
    })

    // Add log
    addUserUpdateLog({ id: updatedUser.id, name: updatedUser.name || "" })

    return updatedUser
}

export async function changeEntitySelected(userId: string, entityId: string) {
    //check if user has the new entity in their entities
    let user = await prisma.user.findFirst({
        where: {
            id: userId,
            Entities: {
                some: {
                    id: entityId,
                },
            },
        },
    })

    if (!user) {
        throw new Error("User does not have access to the selected entity")
    }

    user = await prisma.user.update({
        where: { id: userId },
        data: {
            entitySelectedId: entityId,
        },
    })

    // Add log
    addUserSetEntityLog({ id: user.id, name: user.name || "" })

    return user
}

// Verify user email
export async function verifyUserEmail(userId: string) {
    assertNotSuperAdminUserId(userId)

    const user = await prisma.user.update({
        where: { id: userId },
        data: {
            emailVerified: true,
        },
    })

    // Add log
    addUserEmailVerifiedLog({ id: user.id, name: user.name || "" })

    return user
}

// Sign up user with token validation and user recreation
export async function signUpUser(name: string, email: string, password: string) {
    // find the user created from user-management
    const user = await prisma.user.findUnique({
        where: {
            email: email,
            deletedAt: null,
        },
        include: {
            Entities: true,
            Roles: true,
        },
    })

    if (user) {
        // Delete existing user
        await prisma.user.delete({
            where: {
                id: user.id,
            },
        })

        // Create new account via auth
        const accountUser = await auth.api.signUpEmail({
            body: {
                email: email,
                name: name,
                password: password,
                active: user.active,
                entitySelectedId: user.entitySelectedId,
            },
        })

        // Restore user's entities and roles and createdAt
        await prisma.user.update({
            where: {
                id: accountUser.user.id,
            },
            data: {
                createdAt: user.createdAt,
                Entities: {
                    connect: user.Entities.map((entity) => ({ id: entity.id })),
                },
                Roles: {
                    connect: user.Roles.map((role) => ({ id: role.id })),
                },
            },
        })

        return true
    }

    return false
}

// Delete a user
export async function deleteUser(id: string, currentUserId: string) {
    assertNotSuperAdminUserId(id)

    // Get user details first
    const userToDelete = await prisma.user.findUnique({
        where: { id, deletedAt: null },
    })

    if (!userToDelete) {
        throw new Error("User not found")
    }

    const user = await prisma.user.update({
        where: { id },
        data: {
            deletedAt: new Date(),
            email: userToDelete.email + "_deleted_" + new Date().toISOString(),
        },
    })

    addUserDisableLog({ id: user.id, name: userToDelete.name || "" })

    revalidatePath("/administration/users")
    return user
}

export async function countUsers() {
    return await prisma.user.count({
        where: {
            deletedAt: null,
        },
    })
}
