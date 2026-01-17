"use server"

import { auth } from "@/lib/auth"
import { checkAuth } from "@/lib/auth-guard"
import { actionClient } from "@/lib/safe-action"
import { userSuperAdmin } from "@/prisma/data-seed"
import { checkToken } from "@/services/auth.service"
import {
    assignRolesToUser,
    changeEntitySelected,
    countUsers,
    createUser,
    deleteUser,
    getUsers,
    signUpUser,
    updateUser,
    updateUserProfile,
} from "@/services/user.service"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { z } from "zod"

// Schema for creating a user
const createUserSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "First name must be at least 2 characters")
        .max(64, "Name must be at most 64 characters"),
    email: z.email("Invalid email address"),
    active: z.boolean().default(true),
    entities: z.array(z.string()).min(1, "At least one entity must be selected"),
})

// Schema for updating a user
const updateUserSchema = z.object({
    id: z.string(),
    name: z
        .string()
        .trim()
        .min(2, "First name must be at least 2 characters")
        .max(64, "Name must be at most 64 characters"),
    email: z.email("Invalid email address"),
    active: z.boolean(),
    entitiesToAdd: z.array(z.string()),
    entitiesToRemove: z.array(z.string()),
})

// Schema for deleting a user
const deleteUserSchema = z.object({
    id: z.string(),
})

// Schema for assigning roles to a user
const assignRolesSchema = z.object({
    userId: z.string(),
    roleIds: z.array(z.string()),
})

// Schema for profile update
const updateProfileSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Name must be at least 2 characters")
        .max(64, "Name must be at most 64 characters"),
    email: z.email("Please enter a valid email address"),
    image: z.string().optional(),
})

// Schema for change selected entity
const changeEntitySelectedSchema = z.object({
    entityId: z.string(),
})

const signUpSchema = z.object({
    email: z.email("Invalid email address"),
    password: z
        .string()
        .trim()
        .min(16, "Password must be at least 16 characters")
        .max(64, "Password must be at most 64 characters"),
    passwordConfirmation: z
        .string()
        .trim()
        .min(16, "Password confirmation must be at least 16 characters")
        .max(64, "Password confirmation must be at most 64 characters"),
    token: z.string(),
})

// Server action for updating user profile
export const updateProfileAction = actionClient.inputSchema(updateProfileSchema).action(async ({ parsedInput }) => {
    try {
        // Get current session
        const session = await auth.api.getSession({
            headers: await headers(),
        })

        if (!session) {
            throw new Error("You must be logged in to update your profile")
        }

        // Update the user profile
        const updatedUser = await updateUserProfile(session.user.id, {
            name: parsedInput.name,
            email: parsedInput.email,
            image: parsedInput.image,
        })

        // Revalidate the account page
        revalidatePath("/account")

        return updatedUser
    } catch (error) {
        console.error("Failed to update profile:", error)
        throw new Error("Failed to update profile")
    }
})

// Get all users with their roles
export async function getUsersAction() {
    try {
        // Auth check without permission requirement for read operations
        await checkAuth()

        return await getUsers()
    } catch (error) {
        console.error("Failed to fetch users:", error)
        throw new Error("Failed to fetch users")
    }
}

// Create a new user
export const createUserAction = actionClient.inputSchema(createUserSchema).action(async ({ parsedInput }) => {
    try {
        // Check for user_create permission
        await checkAuth({ requiredPermission: "user_create" })

        // Check user limit if NEXT_PUBLIC_MAX_USER is defined
        if (process.env.NEXT_PUBLIC_MAX_USER) {
            const maxUsers = parseInt(process.env.NEXT_PUBLIC_MAX_USER)
            const currentUserCount = await countUsers()

            if (currentUserCount >= maxUsers) {
                throw new Error(`Maximum number of users reached (${maxUsers})`)
            }
        }

        return await createUser(parsedInput)
    } catch (error) {
        console.error("Failed to create user:", error)
        throw new Error("Failed to create user")
    }
})

// Update an existing user
export const updateUserAction = actionClient.inputSchema(updateUserSchema).action(async ({ parsedInput }) => {
    try {
        // Check for user_edit permission
        const session = await checkAuth({ requiredPermission: "user_edit" })

        if (session.user.id === parsedInput.id) {
            throw new Error("You cannot create a user with the same ID as yourself")
        }

        const { id, ...data } = parsedInput
        return await updateUser(id, data)
    } catch (error) {
        console.error("Failed to update user:", error)
        throw new Error("Failed to update user")
    }
})

// Delete a user
export const deleteUserAction = actionClient.inputSchema(deleteUserSchema).action(async ({ parsedInput }) => {
    try {
        // Check for user_create permission (same as creation for deletion)
        const session = await checkAuth({ requiredPermission: "user_create" })

        if (parsedInput.id === session.user.id) {
            throw new Error("You cannot delete yourself")
        }

        if (parsedInput.id === userSuperAdmin.id) {
            throw new Error("You cannot delete the admin user")
        }

        return await deleteUser(parsedInput.id, session.user.id)
    } catch (error) {
        console.error("Failed to delete user:", error)
        throw new Error("Failed to delete user")
    }
})

// Assign roles to a user
export const assignRolesToUserAction = actionClient
    .schema(assignRolesSchema)
    .action(async ({ parsedInput: { userId, roleIds } }) => {
        try {
            // Check for user_edit permission
            await checkAuth({ requiredPermission: "user_edit" })

            return await assignRolesToUser(userId, roleIds)
        } catch (error) {
            console.error("Failed to assign roles:", error)
            throw new Error("Failed to assign roles")
        }
    })

export const changeEntitySelectedAction = actionClient
    .schema(changeEntitySelectedSchema)
    .action(async ({ parsedInput }) => {
        try {
            // Get current session
            const session = await auth.api.getSession({
                headers: await headers(),
            })

            if (!session) {
                throw new Error("You must be logged in to change entity")
            }

            // Update the user profile
            const updatedUser = await changeEntitySelected(session.user.id, parsedInput.entityId)

            return updatedUser
        } catch (error) {
            console.error("Failed to change entity:", error)
            throw new Error("Failed to change entity")
        }
    })

export const signUpAction = actionClient.inputSchema(signUpSchema).action(async ({ parsedInput }) => {
    if (parsedInput.password !== parsedInput.passwordConfirmation) {
        throw new Error("Passwords do not match")
    }

    const decoded = await checkToken(parsedInput.token, parsedInput.email)
    if (!decoded) {
        throw new Error("Token invalid")
    }

    try {
        const result = await signUpUser(decoded.name, decoded.email, parsedInput.password)

        return result
    } catch (error) {
        console.error("Sign up error:", error)
        throw error
    }
})
