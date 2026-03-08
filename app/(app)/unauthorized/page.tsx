import Unauthorized from "@/components/auth/Unauthorized"

export default async function UnauthorizedPage({
    searchParams,
}: {
    searchParams: Promise<{
        type: "noSession" | "userInactive" | "missingPermission"
        userName?: string
        permission?: string
    }>
}) {
    const { type, userName, permission } = await searchParams

    return (
        <Unauthorized type={type} userName={userName} permission={permission} />
    )
}
