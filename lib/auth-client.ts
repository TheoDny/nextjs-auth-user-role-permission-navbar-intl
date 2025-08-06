import { inferAdditionalFields } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"
export const authClient = createAuthClient({
    /** the base url of the server (optional if you're using the same domain) */
    plugins: [
        inferAdditionalFields({
            user: {
                entitySelectedId: {
                    type: "string",
                    required: false,
                },
                active: {
                    type: "boolean",
                    required: false,
                },
            },
        }),
    ],
})

export const { signIn, signUp, useSession, signOut } = authClient