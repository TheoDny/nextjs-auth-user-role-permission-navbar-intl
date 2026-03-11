import { Account } from "@/components/account/account"
import { pageCheckAuth } from "@/lib/auth-guard"
import { getAllSessionsOfUser } from "@/services/user/user.service"

export default async function AccountPage() {
    const session = await pageCheckAuth()
    const sessions = await getAllSessionsOfUser(session.user.id)
    const currentSessionId = session.session.id

    return (
        <div className="p-2">
            <Account
                session={session}
                sessions={sessions}
                currentSessionId={currentSessionId}
            />
        </div>
    )
}
