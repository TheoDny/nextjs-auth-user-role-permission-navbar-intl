import { Account } from "@/components/account/account"
import { pageCheckAuth } from "@/lib/auth-guard"

export default async function AccountPage() {
    const session = await pageCheckAuth()

    return (
        <div className="p-2">
            <Account session={session} />
        </div>
    )
}
