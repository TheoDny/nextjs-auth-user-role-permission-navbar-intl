import { prisma } from "@/lib/prisma"
import { roleSuperAdmin, userSuperAdmin } from "@/prisma/data-seed"

export const resetDatabase = async () => {
    await clearLog()
    await clearTokenCreateUser()
    await clearRolesExceptSuperAdmin()
    await clearUsersExceptSuperAdmin()
}

export const clearUsersExceptSuperAdmin = async () => {
    await prisma.user.deleteMany({
        where: {
            id: {
                not: userSuperAdmin.id,
            },
        },
    })
}

export const clearRolesExceptSuperAdmin = async () => {
    await prisma.role.deleteMany({
        where: {
            id: {
                not: roleSuperAdmin.id,
            },
        },
    })
}

export const clearTokenCreateUser = async () => {
    await prisma.tokenCreateUser.deleteMany()
}

export const clearLog = async () => {
    await prisma.log.deleteMany()
}
