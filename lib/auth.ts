import { getUserRolesPermissionsAndEntities } from "@/services/auth/auth.service"
import { sendResetPassword } from "@/services/mail/mail.service"
import { i18n } from "@better-auth/i18n"
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { nextCookies } from "better-auth/next-js"
import { customSession } from "better-auth/plugins"
import { prisma } from "./prisma"

export const auth = betterAuth({
    rateLimit: {
        enabled: true,
        max: 10,
        window: 60,
    },
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
        i18n({
            translations: {
                en: {
                    INVALID_EMAIL_OR_PASSWORD: "Invalid email or password",
                    TOO_MANY_REQUESTS: "Too many requests",
                },
                fr: {
                    INVALID_EMAIL_OR_PASSWORD: "Adresse email ou mot de passe invalide",
                    TOO_MANY_REQUESTS: "Trop de tentatives de connexion",
                },
            },
        }),
    ],
})

export type Session = typeof auth.$Infer.Session
