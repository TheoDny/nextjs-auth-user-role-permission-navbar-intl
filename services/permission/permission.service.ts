import { prisma } from "@/lib/prisma"

// Get all permissions
export async function getPermissions() {
    
    const permissions = await prisma.permission.findMany({
        orderBy: {
            code: "asc",
        },
    })

    return permissions
}
