import { Account } from "@/components/account/account"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export default async function AccountPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    })
    if (!session) {
        return null
    }

    return (
        <div className="p-2">
            <Account session={session} />
        </div>
    )
}
