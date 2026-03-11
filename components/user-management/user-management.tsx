"use client"

import { Check, Filter, Pencil, Plus, Search, Trash2, TriangleAlert, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useReducer } from "react"
import { toast } from "sonner"

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
import { RolePermissions } from "@/types/role.type"
import { SessionUser, UserRolesAndEntities } from "@/types/user.type"

import { handleSafeActionResult } from "@/lib/utils.client"
import { userSuperAdmin } from "@/prisma/data-seed"
import { useConfirm } from "@/provider/ConfirmationProvider"
import { UserDialog } from "./user-dialog"

type UserManagementProps = {
    sessionUser: SessionUser
    preloadedUsers: UserRolesAndEntities[]
    roles: RolePermissions[]
}

type UserManagementState = {
    users: UserRolesAndEntities[]
    selectedUser: UserRolesAndEntities | null
    selectedRoles: string[]
    isDialogOpen: boolean
    editingUser: UserRolesAndEntities | null
    isSubmitting: boolean
    isDeleting: boolean
    searchQuery: string
    roleSearchQuery: string
    statusFilter: string
    entityFilter: string[]
    filterOpen: boolean
}

type UserManagementAction = {
    type: "merge"
    payload: Partial<UserManagementState>
}

const userManagementReducer = (
    state: UserManagementState,
    action: UserManagementAction,
): UserManagementState => {
    return { ...state, ...action.payload }
}

export function UserManagement({ sessionUser, preloadedUsers, roles }: UserManagementProps) {
    const t = useTranslations("UserManagement")
    const [state, dispatch] = useReducer(userManagementReducer, {
        users: preloadedUsers,
        selectedUser: null,
        selectedRoles: [],
        isDialogOpen: false,
        editingUser: null,
        isSubmitting: false,
        isDeleting: false,
        searchQuery: "",
        roleSearchQuery: "",
        statusFilter: "all",
        entityFilter: [],
        filterOpen: false,
    })

    const canCreateUser = sessionUser.Permissions.some((permission) => permission.code === "user_create")
    const canEditUser = sessionUser.Permissions.some((permission) => permission.code === "user_edit")

    const { confirm } = useConfirm()

    const getUserRoleIds = (user: UserRolesAndEntities | null) => (user ? user.Roles.map((role) => role.id) : [])

    // Get unique entities for the filter
    const availableEntities: ComboboxOption[] = Array.from(
        new Set(state.users.flatMap((user) => user.Entities.map((entity) => entity.id))),
    ).map((entityId) => {
        const entity = state.users.flatMap((user) => user.Entities).find((e) => e.id === entityId)
        return {
            value: entityId,
            label: entity?.name || "",
        }
    })

    // Filter users based on search query and filters
    const filteredUsers = state.users.filter((user) => {
        // Search filter
        const searchLower = state.searchQuery.toLowerCase()
        const matchesSearch =
            user.name?.toLowerCase().includes(searchLower) || user.email.toLowerCase().includes(searchLower)

        // Status filter
        const matchesStatus =
            state.statusFilter === "all" ||
            (state.statusFilter === "active" && user.active) ||
            (state.statusFilter === "inactive" && !user.active)

        // Entity filter
        const matchesEntity =
            state.entityFilter.length === 0 || user.Entities.some((entity) => state.entityFilter.includes(entity.id))

        return matchesSearch && matchesStatus && matchesEntity
    })

    // Check if any filters are active
    const hasActiveFilters = state.statusFilter !== "all" || state.entityFilter.length > 0

    const clearFilters = () => {
        dispatch({
            type: "merge",
            payload: { statusFilter: "all", entityFilter: [] },
        })
    }

    // Filter roles based on search query
    const filteredRoles = roles.filter((role) => {
        const searchLower = state.roleSearchQuery.toLowerCase()
        return (
            role.name.toLowerCase().includes(searchLower) || role.description.toLowerCase().includes(searchLower)
        )
    })

    const handleUserSelect = (user: UserRolesAndEntities) => {
        if (state.selectedUser?.id === user.id) {
            dispatch({
                type: "merge",
                payload: { selectedUser: null, selectedRoles: [] },
            })
        } else {
            dispatch({
                type: "merge",
                payload: { selectedUser: user, selectedRoles: getUserRoleIds(user) },
            })
        }
    }

    const handleCreateUser = () => {
        dispatch({
            type: "merge",
            payload: { editingUser: null, isDialogOpen: true },
        })
    }

    const handleEditUser = (user: UserRolesAndEntities) => {
        dispatch({
            type: "merge",
            payload: { editingUser: user, isDialogOpen: true },
        })
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

        dispatch({ type: "merge", payload: { isDeleting: true } })

        try {
            const result = await deleteUserAction({ id: user.id })

            const handledResult = handleSafeActionResult(result, {
                error: toast.error,
                errorKeyPrefix: "dialog.error.",
                t,
                fallbackErrorMessage: t("dialog.error.DeleteRoleFail"),
            })
            if (!handledResult.ok) return

            toast.success(t("dialog.success.DeleteUserSuccess"))

            // Clear selection if deleted user was selected
            if (state.selectedUser?.id === user.id) {
                dispatch({
                    type: "merge",
                    payload: { selectedUser: null, selectedRoles: [] },
                })
            }

            // Refresh the users list
            const usersData = await getUsersAction()
            dispatch({ type: "merge", payload: { users: usersData } })
        } catch (error) {
            console.error(error)
            toast.error(t("dialog.error.DeleteUserFail"))
        } finally {
            dispatch({ type: "merge", payload: { isDeleting: false } })
        }
    }

    const handleUserDialogClose = (newUser?: UserRolesAndEntities) => {
        dispatch({ type: "merge", payload: { isDialogOpen: false } })

        if (newUser) {
            // If we're editing the currently selected user, update the selection
            if (state.selectedUser && state.selectedUser.id === newUser.id) {
                dispatch({
                    type: "merge",
                    payload: {
                        selectedUser: newUser,
                        selectedRoles: getUserRoleIds(newUser),
                    },
                })
            }

            // Refresh the users list
            getUsersAction().then((usersData) => {
                dispatch({ type: "merge", payload: { users: usersData } })
            })
        }
    }

    const handleRoleToggle = (roleId: string) => {
        if (state.selectedRoles.includes(roleId)) {
            dispatch({
                type: "merge",
                payload: {
                    selectedRoles: state.selectedRoles.filter((id) => id !== roleId),
                },
            })
            return
        }
        dispatch({
            type: "merge",
            payload: {
                selectedRoles: [...state.selectedRoles, roleId],
            },
        })
    }

    const handleSaveRoles = async () => {
        if (!state.selectedUser) return

        dispatch({ type: "merge", payload: { isSubmitting: true } })

        try {
            await assignRolesToUserAction({
                userId: state.selectedUser.id,
                roleIds: state.selectedRoles,
            })

            // Refresh the users list
            const usersData = await getUsersAction()
            dispatch({ type: "merge", payload: { users: usersData } })

            // Update the selected user
            const updatedUser = usersData.find((u) => u.id === state.selectedUser?.id)
            if (updatedUser) {
                dispatch({
                    type: "merge",
                    payload: {
                        selectedUser: updatedUser,
                        selectedRoles: getUserRoleIds(updatedUser),
                    },
                })
            }

            toast.success("Roles updated successfully")
        } catch (error) {
            console.error(error)
            toast.error("Failed to update roles")
        } finally {
            dispatch({ type: "merge", payload: { isSubmitting: false } })
        }
    }

    const handleCancelRoles = () => {
        if (state.selectedUser) {
            dispatch({
                type: "merge",
                payload: {
                    selectedRoles: state.selectedUser.Roles.map((role) => role.id),
                },
            })
        }
    }

    const hasRolesChanged = () => {
        if (!state.selectedUser) return false

        const currentRoleIds = state.selectedUser.Roles.map((r) => r.id).sort()
        const newRoleIds = [...state.selectedRoles].sort()

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
                                    {state.users.length} / {process.env.NEXT_PUBLIC_MAX_USER}
                                </div>
                            )}
                        </div>
                        <Button
                            size="sm"
                            onClick={handleCreateUser}
                            disabled={
                                !canCreateUser ||
                                (process.env.NEXT_PUBLIC_MAX_USER
                                    ? state.users.length >= parseInt(process.env.NEXT_PUBLIC_MAX_USER)
                                    : false)
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
                                value={state.searchQuery}
                                onChange={(e) =>
                                    dispatch({
                                        type: "merge",
                                        payload: { searchQuery: e.target.value },
                                    })
                                }
                                className="pl-8"
                            />
                        </div>
                        <Popover
                            open={state.filterOpen}
                            onOpenChange={(filterOpen) => dispatch({ type: "merge", payload: { filterOpen } })}
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
                                            {(state.statusFilter !== "all" ? 1 : 0) + state.entityFilter.length}
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
                                                value={state.statusFilter}
                                                onValueChange={(statusFilter) =>
                                                    dispatch({
                                                        type: "merge",
                                                        payload: { statusFilter },
                                                    })
                                                }
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
                                                value={state.entityFilter}
                                                onChange={(value) =>
                                                    dispatch({
                                                        type: "merge",
                                                        payload: { entityFilter: value as string[] },
                                                    })
                                                }
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
                                            state.selectedUser?.id === user.id ? "bg-primary/10" : "hover:bg-muted"
                                        }`}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => handleUserSelect(user)}
                                        onDoubleClick={() => {
                                            if (!canEditUser) return
                                            handleEditUser(user)
                                        }}
                                        onKeyDown={(event) => {
                                            if (event.key === "Enter" || event.key === " ") {
                                                event.preventDefault()
                                                handleUserSelect(user)
                                            }
                                        }}
                                    >
                                        <Checkbox
                                            checked={state.selectedUser?.id === user.id}
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
                                        {canEditUser && (
                                            <div className="flex gap-1">
                                                <Button
                                                    className="cursor-pointer"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        if (!canEditUser) return
                                                        handleEditUser(user)
                                                    }}
                                                    disabled={!canEditUser}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    className="cursor-pointer"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleDeleteUser(user)
                                                    }}
                                                    disabled={
                                                        user.id === userSuperAdmin.id ||
                                                        user.id === sessionUser.id ||
                                                        state.isDeleting
                                                    }
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    <Separator className="my-0" />
                                </div>
                            ))}
                            {filteredUsers.length === 0 && state.searchQuery && (
                                <div className="text-center py-4 text-muted-foreground">{t("noUsersFound")}</div>
                            )}
                            {state.users.length === 0 && !state.searchQuery && (
                                <div className="text-center py-4 text-muted-foreground">{t("noUsers")}</div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Roles Panel */}
            <Card>
                <CardHeader className="flex flex-col justify-between space-y-2 pb-2">
                    <div className="flex flex-row items-center justify-between space-x-2 w-full relative">
                        <CardTitle>{t("roles")}</CardTitle>
                        {state.selectedUser && canEditUser && hasRolesChanged() && (
                            <div className="absolute right-0 space-x-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCancelRoles}
                                    disabled={state.isSubmitting}
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleSaveRoles}
                                    disabled={state.isSubmitting}
                                >
                                    <Check className="h-4 w-4 mr-2" />
                                    Save
                                </Button>
                            </div>
                        )}
                    </div>
                    {state.selectedUser && (
                        <div className="relative w-full">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t("searchRoles")}
                                value={state.roleSearchQuery}
                                onChange={(e) =>
                                    dispatch({
                                        type: "merge",
                                        payload: { roleSearchQuery: e.target.value },
                                    })
                                }
                                className="pl-8"
                            />
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    {state.selectedUser ? (
                        <>
                            <div className="mb-4 p-3 bg-muted rounded-md">
                                <div className="font-medium">{t("assignRolesTo")}</div>
                                <div className="text-sm text-muted-foreground">{state.selectedUser.name}</div>
                            </div>
                            <ScrollArea className="h-full pr-4">
                                <div className="space-y-2">
                                    {filteredRoles.map((role) => (
                                        <div
                                            key={role.id}
                                            className={`flex items-center space-x-2 p-2 rounded-md hover:bg-muted ${canEditUser ? "cursor-pointer" : ""}`}
                                            onClick={() => {
                                                if (!canEditUser) return
                                                handleRoleToggle(role.id)
                                            }}
                                        >
                                            <Checkbox
                                                id={role.id}
                                                checked={state.selectedRoles.includes(role.id)}
                                                onCheckedChange={() => handleRoleToggle(role.id)}
                                                disabled={!canEditUser}
                                                className={`disabled:opacity-100 ${canEditUser ? "cursor-pointer" : "disabled:cursor-default"}`}
                                            />
                                            <div className="flex-1">
                                                <div
                                                    className="text-sm font-medium"
                                                >
                                                    {role.name}
                                                </div>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    {role.description}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {filteredRoles.length === 0 && state.roleSearchQuery && (
                                        <div className="text-center py-4 text-muted-foreground">
                                            {t("noRolesFoundSearch")}
                                        </div>
                                    )}
                                    {roles.length === 0 && !state.roleSearchQuery && (
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
            {(canCreateUser || canEditUser) && (
                <UserDialog
                    open={state.isDialogOpen}
                    onOpenChange={(isDialogOpen) => dispatch({ type: "merge", payload: { isDialogOpen } })}
                    user={state.editingUser}
                    entitiesCanUse={sessionUser.Entities}
                    onClose={handleUserDialogClose}
                />
            )}
        </div>
    )
}
