"use client"

import { Check, Filter, Pencil, Plus, Search, Trash2, TriangleAlert, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { getRolesAction } from "@/actions/role.action"
import { assignRolesToUserAction, deleteUserAction, getUsersAction } from "@/actions/user.action"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Combobox, ComboboxOption } from "@/components/ui/combobox"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { EntityModel as Entity } from "@/prisma/generated/models/Entity"
import { UserModel as User } from "@/prisma/generated/models/User"
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
    const [searchQuery, setSearchQuery] = useState("")
    const [roleSearchQuery, setRoleSearchQuery] = useState("")

    // Filter states
    const [statusFilter, setStatusFilter] = useState<string>("all") // "all", "active", "inactive"
    const [entityFilter, setEntityFilter] = useState<string[]>([])
    const [filterOpen, setFilterOpen] = useState(false)

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

    // Get unique entities for the filter
    const availableEntities: ComboboxOption[] = Array.from(
        new Set(users.flatMap((user) => user.Entities.map((entity) => entity.id))),
    ).map((entityId) => {
        const entity = users.flatMap((user) => user.Entities).find((e) => e.id === entityId)
        return {
            value: entityId,
            label: entity?.name || "",
        }
    })

    // Filter users based on search query and filters
    const filteredUsers = users.filter((user) => {
        // Search filter
        const searchLower = searchQuery.toLowerCase()
        const matchesSearch =
            user.name?.toLowerCase().includes(searchLower) || user.email.toLowerCase().includes(searchLower)

        // Status filter
        const matchesStatus =
            statusFilter === "all" ||
            (statusFilter === "active" && user.active) ||
            (statusFilter === "inactive" && !user.active)

        // Entity filter
        const matchesEntity =
            entityFilter.length === 0 || user.Entities.some((entity) => entityFilter.includes(entity.id))

        return matchesSearch && matchesStatus && matchesEntity
    })

    // Check if any filters are active
    const hasActiveFilters = statusFilter !== "all" || entityFilter.length > 0

    const clearFilters = () => {
        setStatusFilter("all")
        setEntityFilter([])
    }

    // Filter roles based on search query
    const filteredRoles = roles.filter((role) => {
        const searchLower = roleSearchQuery.toLowerCase()
        return (
            role.name.toLowerCase().includes(searchLower) || role.description.toLowerCase().includes(searchLower)
        )
    })

    const handleUserSelect = (user: UserRolesAndEntities) => {
        if (selectedUser?.id === user.id) {
            setSelectedUser(null)
        } else {
            setSelectedUser(user)
        }
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
                <CardHeader className="flex flex-col justify-between space-y-0 pb-2">
                    <div className="flex flex-row items-center justify-between space-x-2 w-full">
                        <div className="flex flex-col">
                            <CardTitle>{t("users")}</CardTitle>
                            {process.env.NEXT_PUBLIC_MAX_USER && (
                                <div className="text-sm text-muted-foreground">
                                    {users.length} / {process.env.NEXT_PUBLIC_MAX_USER}
                                </div>
                            )}
                        </div>
                        <Button
                            size="sm"
                            onClick={handleCreateUser}
                            disabled={
                                process.env.NEXT_PUBLIC_MAX_USER
                                    ? users.length >= parseInt(process.env.NEXT_PUBLIC_MAX_USER)
                                    : false
                            }
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            {t("newUser")}
                        </Button>
                    </div>
                    <div className="flex items-center space-x-2 w-full">
                        <div className="relative flex-1">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="search-filter-users"
                                placeholder={t("search")}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                        <Popover
                            open={filterOpen}
                            onOpenChange={setFilterOpen}
                        >
                            <PopoverTrigger asChild>
                                <Button
                                    variant={hasActiveFilters ? "default" : "outline"}
                                    size="sm"
                                    className="px-3"
                                >
                                    <Filter className="h-4 w-4" />
                                    {hasActiveFilters && (
                                        <span className="ml-1 text-xs">
                                            {(statusFilter !== "all" ? 1 : 0) + entityFilter.length}
                                        </span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-80"
                                align="end"
                            >
                                <div>
                                    <div className="flex items-center justify-between">
                                        {hasActiveFilters && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={clearFilters}
                                                className="h-auto p-0 text-xs"
                                            >
                                                {t("filters.clear")}
                                            </Button>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-sm font-medium mb-2 block">
                                                {t("filters.status")}
                                            </label>
                                            <RadioGroup
                                                value={statusFilter}
                                                onValueChange={setStatusFilter}
                                                className="flex space-x-4"
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem
                                                        value="all"
                                                        id="all"
                                                    />
                                                    <label
                                                        htmlFor="all"
                                                        className="text-sm"
                                                    >
                                                        {t("filters.all")}
                                                    </label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem
                                                        value="active"
                                                        id="active"
                                                    />
                                                    <label
                                                        htmlFor="active"
                                                        className="text-sm"
                                                    >
                                                        {t("status.active")}
                                                    </label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem
                                                        value="inactive"
                                                        id="inactive"
                                                    />
                                                    <label
                                                        htmlFor="inactive"
                                                        className="text-sm"
                                                    >
                                                        {t("status.inactive")}
                                                    </label>
                                                </div>
                                            </RadioGroup>
                                        </div>

                                        <div>
                                            <label className="text-sm font-medium mb-2 block">
                                                {t("filters.entities")}
                                            </label>
                                            <Combobox
                                                options={availableEntities}
                                                value={entityFilter}
                                                onChange={(value) => setEntityFilter(value as string[])}
                                                placeholder={t("filters.selectEntities")}
                                                emptyMessage={t("filters.noEntities")}
                                                multiple={true}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-full pr-4">
                        <div>
                            {filteredUsers.map((user) => (
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
                            {filteredUsers.length === 0 && searchQuery && (
                                <div className="text-center py-4 text-muted-foreground">{t("noUsersFound")}</div>
                            )}
                            {users.length === 0 && !searchQuery && (
                                <div className="text-center py-4 text-muted-foreground">{t("noUsers")}</div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Roles Panel */}
            <Card>
                <CardHeader className="flex flex-col justify-between space-y-2 pb-2">
                    <div className="flex flex-row items-center justify-between space-x-2 w-full">
                        <CardTitle>{t("roles")}</CardTitle>
                        {selectedUser && hasRolesChanged() && (
                            <div className="flex space-x-2">
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
                    </div>
                    {selectedUser && (
                        <div className="relative w-full">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t("searchRoles")}
                                value={roleSearchQuery}
                                onChange={(e) => setRoleSearchQuery(e.target.value)}
                                className="pl-8"
                            />
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
                                    {filteredRoles.map((role) => (
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
                                    {filteredRoles.length === 0 && roleSearchQuery && (
                                        <div className="text-center py-4 text-muted-foreground">
                                            {t("noRolesFoundSearch")}
                                        </div>
                                    )}
                                    {roles.length === 0 && !roleSearchQuery && (
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
