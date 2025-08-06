"use client"

import { Check, Pencil, Plus, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { getRolesAction } from "@/actions/role-actions"
import { assignRolesToUserAction, getUsersAction } from "@/actions/user-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Entity, Role, User } from "@/prisma/generated"
import { UserRolesAndEntities } from "@/types/user.type"
import { UserDialog } from "./user-dialog"

export function UserManagement({ sessionUser }: { sessionUser: User & { Entities: Entity[] } }) {
    const t = useTranslations("UserManagement")
    const [users, setUsers] = useState<UserRolesAndEntities[]>([])
    const [roles, setRoles] = useState<Role[]>([])
    const [selectedUser, setSelectedUser] = useState<UserRolesAndEntities | null>(null)
    const [selectedRoles, setSelectedRoles] = useState<string[]>([])
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<UserRolesAndEntities | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        const loadData = async () => {
            try {
                const usersData = await getUsersAction()
                setUsers(usersData)

                const rolesData = await getRolesAction()
                setRoles(rolesData)
            } catch (error) {
                console.error(error)
                toast.error("Failed to load data")
            }
        }

        loadData()
    }, [])

    useEffect(() => {
        if (selectedUser) {
            setSelectedRoles(selectedUser.Roles.map((role) => role.id))
        } else {
            setSelectedRoles([])
        }
    }, [selectedUser])

    const handleUserSelect = (user: UserRolesAndEntities) => {
        setSelectedUser(user)
    }

    const handleCreateUser = () => {
        setEditingUser(null)
        setIsDialogOpen(true)
    }

    const handleEditUser = (user: UserRolesAndEntities) => {
        setEditingUser(user)
        setIsDialogOpen(true)
    }

    const handleUserDialogClose = (newUser?: UserRolesAndEntities) => {
        setIsDialogOpen(false)

        if (newUser) {
            // If we're editing the currently selected user, update the selection
            if (selectedUser && selectedUser.id === newUser.id) {
                setSelectedUser(newUser)
            }

            // Refresh the users list
            getUsersAction().then(setUsers)
        }
    }

    const handleRoleToggle = (roleId: string) => {
        setSelectedRoles((current) => {
            if (current.includes(roleId)) {
                return current.filter((id) => id !== roleId)
            } else {
                return [...current, roleId]
            }
        })
    }

    const handleSaveRoles = async () => {
        if (!selectedUser) return

        setIsSubmitting(true)

        try {
            await assignRolesToUserAction({
                userId: selectedUser.id,
                roleIds: selectedRoles,
            })

            toast.success("Roles updated successfully")

            // Refresh the users list
            const updatedUsers = await getUsersAction()
            setUsers(updatedUsers)

            // Update the selected user with the new roles
            const updatedUser = updatedUsers.find((u) => u.id === selectedUser.id)
            if (updatedUser) {
                setSelectedUser(updatedUser)
            }
        } catch (error) {
            console.error(error)
            toast.error("Failed to update roles")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCancelRoles = () => {
        if (selectedUser) {
            setSelectedRoles(selectedUser.Roles.map((role) => role.id))
        }
    }

    const hasRolesChanged = () => {
        if (!selectedUser) return false

        const currentRoleIds = selectedUser.Roles.map((r) => r.id).sort()
        const newRoleIds = [...selectedRoles].sort()

        return (
            currentRoleIds.length !== newRoleIds.length ||
            currentRoleIds.some((id, index) => id !== newRoleIds[index])
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            {/* Users Panel */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle>{t("users")}</CardTitle>
                    <Button
                        size="sm"
                        onClick={handleCreateUser}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        {t("newUser")}
                    </Button>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-full pr-4">
                        <div>
                            {users.map((user) => (
                                <div key={user.id}>
                                    <div
                                        className={`flex items-center space-x-2 p-2 m-1 rounded-md cursor-pointer ${
                                            selectedUser?.id === user.id ? "bg-primary/10" : "hover:bg-muted"
                                        }`}
                                        onClick={() => handleUserSelect(user)}
                                        onDoubleClick={() => handleEditUser(user)}
                                    >
                                        <Checkbox
                                            checked={selectedUser?.id === user.id}
                                            onCheckedChange={() => handleUserSelect(user)}
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium">{user.name}</div>
                                            <div className="text-sm text-muted-foreground">{user.email}</div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {user.active ? (
                                                    <span className="text-green-500">Active</span>
                                                ) : (
                                                    <span className="text-red-500">Inactive</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-1 flex-1">
                                            {user.Entities.length <= 5 ? (
                                                user.Entities.map((entity) => (
                                                    <Badge
                                                        key={entity.id}
                                                        variant="default"
                                                        className="text-xs"
                                                    >
                                                        {entity.name}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <HoverCard>
                                                    <HoverCardTrigger asChild>
                                                        <div className="flex flex-wrap gap-1">
                                                            {user.Entities.slice(0, 5).map((entity) => (
                                                                <Badge
                                                                    key={entity.id}
                                                                    variant="secondary"
                                                                    className="text-xs"
                                                                >
                                                                    {entity.name}
                                                                </Badge>
                                                            ))}

                                                            <Badge
                                                                variant="default"
                                                                className="text-xs cursor-pointer"
                                                            >
                                                                +{user.Entities.length - 5}
                                                            </Badge>
                                                        </div>
                                                    </HoverCardTrigger>
                                                    <HoverCardContent className="w-auto p-2">
                                                        <div className="flex flex-wrap gap-1">
                                                            {user.Entities.slice(5).map((entity) => (
                                                                <Badge
                                                                    key={entity.id}
                                                                    variant="outline"
                                                                    className="text-xs"
                                                                >
                                                                    {entity.name}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </HoverCardContent>
                                                </HoverCard>
                                            )}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleEditUser(user)
                                            }}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <Separator />
                                </div>
                            ))}
                            {users.length === 0 && (
                                <div className="text-center py-4 text-muted-foreground">
                                    No users found. Create your first user.
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Roles Panel */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                    <CardTitle>{t("roles")}</CardTitle>
                    {selectedUser && hasRolesChanged() && (
                        <div className="flex space-x-2 absolute right-4">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelRoles}
                                disabled={isSubmitting}
                            >
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleSaveRoles}
                                disabled={isSubmitting}
                            >
                                <Check className="h-4 w-4 mr-2" />
                                Save
                            </Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    {selectedUser ? (
                        <ScrollArea className="h-full pr-4">
                            <div className="space-y-4">
                                <div className="text-sm font-medium">
                                    {t("assignRolesTo")}:{" "}
                                    <span className="font-bold text-xl">{selectedUser.name}</span>
                                </div>
                                <Separator />
                                <div className="space-y-2">
                                    {roles.map((role) => (
                                        <div
                                            key={role.id}
                                            onClick={() => handleRoleToggle(role.id)}
                                            className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted cursor-pointer"
                                        >
                                            <Checkbox
                                                checked={selectedRoles.includes(role.id)}
                                                onClick={() => {
                                                    handleRoleToggle(role.id)
                                                }}
                                                onCheckedChange={() => handleRoleToggle(role.id)}
                                                className="cursor-pointer"
                                            />
                                            <div className="flex-1">
                                                <h2 className="font-medium cursor-pointer">{role.name}</h2>
                                                <p className="text-sm text-muted-foreground">{role.description}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {roles.length === 0 && (
                                        <div className="text-center py-4 text-muted-foreground">
                                            No roles found.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </ScrollArea>
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            Select a user to manage roles
                        </div>
                    )}
                </CardContent>
            </Card>

            <UserDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                user={editingUser}
                onClose={handleUserDialogClose}
                entitiesCanUse={sessionUser.Entities}
            />
        </div>
    )
}
