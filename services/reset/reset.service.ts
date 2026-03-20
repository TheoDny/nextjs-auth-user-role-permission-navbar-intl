import { prisma } from "@/lib/prisma"
import { protectedEntityIds, roleSuperAdmin, userSuperAdmin } from "@/prisma/data-seed"

export const resetDatabase = async () => {
    await clearLog()
    await clearTokenCreateUser()
    await clearUsersExceptSuperAdmin()
    await clearRolesExceptSuperAdmin()
    await clearEntitiesExceptProtected()
    await clearAllSessions()
    await clearAllAccountsExceptSuperAdmin()
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

export const clearAllSessions = async () => {
    await prisma.session.deleteMany()
}

export const clearAllAccountsExceptSuperAdmin = async () => {
    await prisma.account.deleteMany({
        where: {
            userId: {
                not: userSuperAdmin.id,
            },
        },
    })
}

export const clearEntitiesExceptProtected = async () => {
    await prisma.entity.deleteMany({
        where: {
            id: {
                notIn: protectedEntityIds,
            },
        },
    })
}
