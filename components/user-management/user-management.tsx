"use client"

import { Check, Pencil, Plus, Trash2, TriangleAlert, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { getRolesAction } from "@/actions/role-actions"
import { assignRolesToUserAction, deleteUserAction, getUsersAction } from "@/actions/user-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Entity, User } from "@/prisma/generated"
import { RolePermissions } from "@/types/role.type"
import { UserRolesAndEntities } from "@/types/user.type"

import { userSuperAdmin } from "@/prisma/data-seed"
import { useConfirm } from "@/provider/ConfirmationProvider"
import { UserDialog } from "./user-dialog"

export function UserManagement({ sessionUser }: { sessionUser: User & { Entities: Entity[] } }) {
    const t = useTranslations("UserManagement")
    const [users, setUsers] = useState<UserRolesAndEntities[]>([])
    const [roles, setRoles] = useState<RolePermissions[]>([])
    const [selectedUser, setSelectedUser] = useState<UserRolesAndEntities | null>(null)
    const [selectedRoles, setSelectedRoles] = useState<string[]>([])
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<UserRolesAndEntities | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const { confirm } = useConfirm()

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

    const handleDeleteUser = async (user: UserRolesAndEntities) => {
        if (user.id === userSuperAdmin.id) {
            toast.error(t("dialog.error.cannotDeleteAdmin"))
            return
        }

        if (user.id === sessionUser.id) {
            toast.error(t("dialog.error.cannotDeleteSelf"))
            return
        }

        if (!(await confirm(t("confirmDelete")))) {
            return
        }

        setIsDeleting(true)

        try {
            const result = await deleteUserAction({ id: user.id })

            if (result?.serverError) {
                console.error(result?.serverError)
                return toast.error(t("dialog.error.DeleteUserFail"))
            } else if (result?.validationErrors) {
                console.error(result?.validationErrors)
                return toast.error(t("dialog.error.DeleteUserFail"))
            } else if (!result?.data) {
                console.error("No data returned")
                return toast.error(t("dialog.error.DeleteUserFail"))
            }

            toast.success(t("dialog.success.DeleteUserSuccess"))

            // Clear selection if deleted user was selected
            if (selectedUser?.id === user.id) {
                setSelectedUser(null)
            }

            // Refresh the users list
            const usersData = await getUsersAction()
            setUsers(usersData)
        } catch (error) {
            console.error(error)
            toast.error(t("dialog.error.DeleteUserFail"))
        } finally {
            setIsDeleting(false)
        }
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

            // Refresh the users list
            const usersData = await getUsersAction()
            setUsers(usersData)

            // Update the selected user
            const updatedUser = usersData.find((u) => u.id === selectedUser.id)
            if (updatedUser) {
                setSelectedUser(updatedUser)
            }

            toast.success("Roles updated successfully")
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

    const hasWarnings = (user: UserRolesAndEntities) => {
        const hasNoRoles = user.Roles.length === 0
        return hasNoRoles
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
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{user.name}</span>
                                                {hasWarnings(user) && (
                                                    <HoverCard>
                                                        <HoverCardTrigger asChild>
                                                            <TriangleAlert className="h-4 w-4 text-orange-500" />
                                                        </HoverCardTrigger>
                                                        <HoverCardContent className="w-80">
                                                            <div className="space-y-2">
                                                                {user.Roles.length === 0 && (
                                                                    <div className="text-sm text-orange-600">
                                                                        ⚠️ {t("warnings.noRoles")}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </HoverCardContent>
                                                    </HoverCard>
                                                )}
                                            </div>
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
                                                                    variant="default"
                                                                    className="text-xs"
                                                                >
                                                                    {entity.name}
                                                                </Badge>
                                                            ))}
                                                            <Badge
                                                                variant="outline"
                                                                className="text-xs"
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
                                        <div className="flex gap-1">
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
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDeleteUser(user)
                                                }}
                                                disabled={
                                                    user.id === userSuperAdmin.id ||
                                                    user.id === sessionUser.id ||
                                                    isDeleting
                                                }
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <Separator className="my-0" />
                                </div>
                            ))}
                            {users.length === 0 && (
                                <div className="text-center py-4 text-muted-foreground">{t("noUsers")}</div>
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
                        <>
                            <div className="mb-4 p-3 bg-muted rounded-md">
                                <div className="font-medium">{t("assignRolesTo")}</div>
                                <div className="text-sm text-muted-foreground">{selectedUser.name}</div>
                            </div>
                            <ScrollArea className="h-full pr-4">
                                <div className="space-y-2">
                                    {roles.map((role) => (
                                        <div
                                            key={role.id}
                                            className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted"
                                        >
                                            <Checkbox
                                                id={role.id}
                                                checked={selectedRoles.includes(role.id)}
                                                onCheckedChange={() => handleRoleToggle(role.id)}
                                            />
                                            <div className="flex-1">
                                                <label
                                                    htmlFor={role.id}
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                >
                                                    {role.name}
                                                </label>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    {role.description}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {roles.length === 0 && (
                                        <div className="text-center py-4 text-muted-foreground">
                                            {t("noRolesFound")}
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            Select a user to manage their roles
                        </div>
                    )}
                </CardContent>
            </Card>

            <UserDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                user={editingUser}
                entitiesCanUse={sessionUser.Entities}
                onClose={handleUserDialogClose}
            />
        </div>
    )
}
