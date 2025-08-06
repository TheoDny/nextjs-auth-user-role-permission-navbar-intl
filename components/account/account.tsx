import { EditProfile } from "@/components/account/edit-profile"
import { LanguageSelector } from "@/components/select/select-language"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Session } from "@/lib/auth"
import { useTranslations } from "next-intl"

// Define the expected structure based on the custom session plugin
interface SessionUser {
    id: string
    name: string
    email: string
    emailVerified: boolean
    createdAt: Date
    updatedAt: Date
    image?: string | null
    active: boolean
    entitySelectedId: string
    Roles: { id: string; name: string }[]
    Entities: { id: string; name: string }[]
    Permissions: { code: string }[]
}

export function Account({ session }: { session: Session }) {
    // Cast user to SessionUser to access the custom fields
    const user = session.user as unknown as SessionUser

    // Get translations
    const tAccount = useTranslations("Account")
    const tPermissions = useTranslations("Permissions")

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>{tAccount("profile.title")}</CardTitle>
                    <CardDescription>{tAccount("profile.description")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage
                                src={user.image || ""}
                                alt={user.name || tAccount("profile.userAlt")}
                            />
                            <AvatarFallback className="text-lg">
                                {user.name
                                    ?.split(" ")
                                    .map((n) => n[0]?.toUpperCase())
                                    .join("")
                                    .slice(0, 2) || "U"}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h3 className="text-xl font-semibold">{user.name}</h3>
                            <p className="text-muted-foreground">{user.email}</p>
                            <EditProfile
                                currentName={user.name}
                                currentEmail={user.email}
                                currentImage={user.image}
                            />
                        </div>
                    </div>
                    <Separator />
                    <div>
                        <h4 className="font-medium mb-2">{tAccount("profile.language")}</h4>
                        <div className="flex items-center">
                            <LanguageSelector />
                        </div>
                    </div>
                    <Separator />
                    <div className="space-4 flex flex-row gap-4">
                        <div>
                            <h4 className="font-medium mb-2">{tAccount("profile.selectedEntity")}</h4>
                            <div className="text-muted-foreground">
                                {user.Entities?.find((entity) => entity.id === user.entitySelectedId)?.name ||
                                    tAccount("profile.noEntity")}
                            </div>
                        </div>
                        <Separator
                            orientation="vertical"
                            className="shrink-0 bg-border h-full w-[1px]"
                        />
                        <div>
                            <h4 className="font-medium mb-2">{tAccount("profile.availableEntities")}</h4>
                            <div className="flex flex-wrap gap-2">
                                {user.Entities?.map((entity) => (
                                    <Badge
                                        key={entity.id}
                                        variant={entity.id === user.entitySelectedId ? "default" : "outline"}
                                    >
                                        {entity.name}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{tAccount("permissions.title")}</CardTitle>
                    <CardDescription>{tAccount("permissions.description")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h4 className="font-medium mb-2">{tAccount("permissions.assignedRoles")}</h4>
                        <div className="grid xl:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-2">
                            {user.Roles?.map((role) => (
                                <div
                                    key={role.id}
                                    className="bg-muted p-3 rounded-lg"
                                >
                                    <div className="flex items-center justify-between">
                                        <Badge
                                            variant="outline"
                                            className="text-sm"
                                        >
                                            {role.name}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <Separator />
                    <div>
                        <h4 className="font-medium mb-2">{tAccount("permissions.permissionsList")}</h4>
                        <div className="grid xl:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-2 ">
                            {user.Permissions?.sort((a, b) => a.code.localeCompare(b.code)).map((permission) => (
                                <div
                                    key={permission.code}
                                    className="bg-muted p-3 rounded-lg"
                                >
                                    <div className="flex items-center justify-between">
                                        <Badge
                                            variant="outline"
                                            className="text-sm"
                                        >
                                            {permission.code}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {tPermissions(permission.code, {
                                            fallback: tAccount("permissions.noDescription"),
                                        })}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
