import { prisma } from "@/lib/prisma"

// Get all permissions
export async function getPermissions() {
    try {
        const permissions = await prisma.permission.findMany({
            orderBy: {
                code: "asc",
            },
        })

        return permissions
    } catch (error) {
        console.error("Failed to fetch permissions:", error)
        throw new Error("Failed to fetch permissions")
    }
}
