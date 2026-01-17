import { getUserRolesPermissionsAndEntities } from "@/services/auth.service"
import { sendResetPassword } from "@/services/mail.service"
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { nextCookies } from "better-auth/next-js"
import { customSession } from "better-auth/plugins"
import { prisma } from "./prisma"
export const auth = betterAuth({
    user: {
        additionalFields: {
            // firstname: {
            //     type: "string",
            //     required: true,
            //     input: true,
            // },
            // lastname: {
            //     type: "string",
            //     required: true,
            //     input: true,
            // },
            active: {
                type: "boolean",
                required: false,
                defaultValue: true,
                input: true,
                returned: true,
            },
            entitySelectedId: {
                type: "string",
                required: false,
                defaultValue: "cm8skzpbi0001e58ge65z1rkz", // admin entity
                input: true,
            },
        },
    },
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
        minPasswordLength: 16,
        maxPasswordLength: 128,
        async sendResetPassword(data, _request) {
            sendResetPassword(data.user.email, data.url)
        },
    },
    plugins: [
        customSession(async ({ user, session }) => {
            const userInfer = user as typeof user & { entitySelectedId: string; active: boolean }
            const rolesPermissionAndEntities = await getUserRolesPermissionsAndEntities(session.userId)
            return {
                user: {
                    Roles: rolesPermissionAndEntities.Roles,
                    Permissions: rolesPermissionAndEntities.Permissions,
                    Entities: rolesPermissionAndEntities.Entities,
                    EntitySelected: rolesPermissionAndEntities.EntitySelected,
                    ...userInfer,
                },
                session,
            }
        }),
        nextCookies(),
    ],
})

export type Session = typeof auth.$Infer.Session