"use client"

import { Check, Pencil, Plus, Search, Trash2, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useMemo, useReducer } from "react"
import { toast } from "sonner"

import { assignPermissionsToRoleAction, deleteRoleAction, getRolesAction } from "@/actions/role.action"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { handleSafeActionResult } from "@/lib/utils.client"
import { Permission, Role } from "@/prisma/generated/client"
import { useConfirm } from "@/provider/ConfirmationProvider"
import { RolePermissions } from "@/types/role.type"
import { SessionUser } from "@/types/user.type"
import { RoleDialog } from "./role-dialog"

type PermissionMatrixItem = {
    code: string
    module: string
    action: string
}

const COMMON_ACTIONS_ORDER = ["read", "create", "edit"]

function parsePermissionCode(code: string): PermissionMatrixItem {
    const segments = code.split("_").filter(Boolean)
    if (segments.length < 2) {
        return { code, module: "other", action: code }
    }
    return {
        code,
        module: segments.slice(0, -1).join("_"),
        action: segments[segments.length - 1] || code,
    }
}

function sortActions(actionA: string, actionB: string): number {
    const actionAIndex = COMMON_ACTIONS_ORDER.indexOf(actionA)
    const actionBIndex = COMMON_ACTIONS_ORDER.indexOf(actionB)
    const hasActionAIndex = actionAIndex !== -1
    const hasActionBIndex = actionBIndex !== -1
    if (hasActionAIndex && hasActionBIndex) return actionAIndex - actionBIndex
    if (hasActionAIndex) return -1
    if (hasActionBIndex) return 1
    return actionA.localeCompare(actionB)
}

const getRolePermissionCodes = (role: RolePermissions | null) =>
    role ? role.Permissions.map((permission) => permission.code) : []


type RoleManagementProps = {
    sessionUser: SessionUser
    preloadedRoles: RolePermissions[]
    permissions: Permission[]
}

type RoleManagementState = {
    roles: RolePermissions[]
    selectedRole: RolePermissions | null
    selectedPermissions: string[]
    isDialogOpen: boolean
    editingRole: Role | null
    isSubmitting: boolean
    isDeleting: boolean
    searchQuery: string
    permissionSearchQuery: string
}

type RoleManagementAction =
    | {
          type: "merge"
          payload: Partial<RoleManagementState>
      }
    | {
          type: "setSelectedPermissions"
          payload: string[]
      }

const roleManagementReducer = (
    state: RoleManagementState,
    action: RoleManagementAction,
): RoleManagementState => {
    switch (action.type) {
        case "merge":
            return { ...state, ...action.payload }
        case "setSelectedPermissions":
            return { ...state, selectedPermissions: action.payload }
        default:
            return state
    }
}

export function RoleManagement({ sessionUser, preloadedRoles, permissions }: RoleManagementProps) {
    const [state, dispatch] = useReducer(roleManagementReducer, {
        roles: preloadedRoles,
        selectedRole: null,
        selectedPermissions: [],
        isDialogOpen: false,
        editingRole: null,
        isSubmitting: false,
        isDeleting: false,
        searchQuery: "",
        permissionSearchQuery: "",
    })

    const canCreateRole = sessionUser.Permissions.some((permission) => permission.code === "role_create")
    const canEditRole = sessionUser.Permissions.some((permission) => permission.code === "role_edit")

    const t = useTranslations("RoleManagement")
    const tPermissions = useTranslations("Permissions")

    const { confirm } = useConfirm()
    
    // Filter roles based on search query
    const filteredRoles = state.roles.filter((role) => {
        const searchLower = state.searchQuery.toLowerCase()
        return (
            role.name.toLowerCase().includes(searchLower) || role.description.toLowerCase().includes(searchLower)
        )
    })

    // Filter permissions based on search query
    const filteredPermissions = permissions.filter((permission) => {
        const searchLower = state.permissionSearchQuery.toLowerCase()
        return (
            permission.code.toLowerCase().includes(searchLower) ||
            tPermissions(permission.code).toLowerCase().includes(searchLower)
        )
    })

    const matrixPermissionItems = useMemo(
        () => filteredPermissions.map((p) => parsePermissionCode(p.code)),
        [filteredPermissions],
    )
    const permissionActions = useMemo(() => {
        const uniqueActions = Array.from(new Set(matrixPermissionItems.map((p) => p.action)))
        return uniqueActions.sort(sortActions)
    }, [matrixPermissionItems])
    const permissionModules = useMemo(() => {
        const uniqueModules = Array.from(new Set(matrixPermissionItems.map((p) => p.module)))
        return uniqueModules.sort((a, b) => a.localeCompare(b))
    }, [matrixPermissionItems])
    const permissionCodeByModuleAction = useMemo(() => {
        const map = new Map<string, string>()
        matrixPermissionItems.forEach((item) => {
            map.set(`${item.module}__${item.action}`, item.code)
        })
        return map
    }, [matrixPermissionItems])

    const getPermissionCodeForCell = (module: string, action: string) =>
        permissionCodeByModuleAction.get(`${module}__${action}`)
    const getActionLabel = (action: string) =>
        t.has(`actions.${action}`) ? t(`actions.${action}`) : action
    const getModuleLabel = (module: string) =>
        t.has(`modules.${module}`) ? t(`modules.${module}`) : module

    const handleRoleSelect = (role: RolePermissions) => {
        if (state.selectedRole?.id === role.id) {
            dispatch({
                type: "merge",
                payload: { selectedRole: null, selectedPermissions: [] },
            })
        } else {
            dispatch({
                type: "merge",
                payload: { selectedRole: role, selectedPermissions: getRolePermissionCodes(role) },
            })
        }
    }

    const handleCreateRole = () => {
        dispatch({
            type: "merge",
            payload: { editingRole: null, isDialogOpen: true },
        })
    }

    const handleEditRole = (role: Role) => {
        dispatch({
            type: "merge",
            payload: { editingRole: role, isDialogOpen: true },
        })
    }

    const handleDeleteRole = async (role: Role) => {
        if (!(await confirm(t("confirmDelete")))) {
            return
        }

        dispatch({ type: "merge", payload: { isDeleting: true } })

        try {
            const result = await deleteRoleAction({ id: role.id })

            const handledResult = handleSafeActionResult(result, {
                error: toast.error,
                errorKeyPrefix: "dialog.error.",
                t,
                fallbackErrorMessage: t("dialog.error.DeleteRoleFail"),
            })
            if (!handledResult.ok) return

            toast.success(t("dialog.success.DeleteRoleSuccess"))

            // Clear selection if deleted role was selected
            if (state.selectedRole?.id === role.id) {
                dispatch({
                    type: "merge",
                    payload: { selectedRole: null, selectedPermissions: [] },
                })
            }

            // Refresh the roles list
            const rolesData = await getRolesAction()
            dispatch({ type: "merge", payload: { roles: rolesData } })
        } catch (error) {
            console.error(error)
            toast.error(t("dialog.error.DeleteRoleFail"))
        } finally {
            dispatch({ type: "merge", payload: { isDeleting: false } })
        }
    }

    const handleRoleDialogClose = (newRole?: RolePermissions) => {
        dispatch({ type: "merge", payload: { isDialogOpen: false } })

        if (newRole) {
            // If we're editing the currently selected role, update the selection
            if (state.selectedRole && state.selectedRole.id === newRole.id) {
                dispatch({
                    type: "merge",
                    payload: {
                        selectedRole: newRole,
                        selectedPermissions: getRolePermissionCodes(newRole),
                    },
                })
            }

            // Refresh the roles list
            getRolesAction().then((rolesData) => {
                dispatch({ type: "merge", payload: { roles: rolesData } })
            })
        }
    }

    const handlePermissionToggle = (permissionCode: string) => {
        const current = state.selectedPermissions
        if (current.includes(permissionCode)) {
            dispatch({
                type: "setSelectedPermissions",
                payload: current.filter((id) => id !== permissionCode),
            })
            return
        }
        const nextPermissions = new Set([...current, permissionCode])
        const permission = parsePermissionCode(permissionCode)
        if (permission.action === "create" || permission.action === "edit") {
            const readCode = getPermissionCodeForCell(permission.module, "read")
            if (readCode) nextPermissions.add(readCode)
        }
        dispatch({
            type: "setSelectedPermissions",
            payload: Array.from(nextPermissions),
        })
    }

    const handleSavePermissions = async () => {
        if (!state.selectedRole) return

        dispatch({ type: "merge", payload: { isSubmitting: true } })

        try {
            const result = await assignPermissionsToRoleAction({
                roleId: state.selectedRole.id,
                permissionCodes: state.selectedPermissions,
            })

            const handledResult = handleSafeActionResult(result, {
                error: toast.error,
                errorKeyPrefix: "dialog.error.",
                t,
                fallbackErrorMessage: t("dialog.error.UpdateRoleFail"),
            })
            if (!handledResult.ok) return

            // Refresh the roles list
            const rolesData = await getRolesAction()
            dispatch({ type: "merge", payload: { roles: rolesData } })

            // Update the selected role
            const updatedRole = rolesData.find((r) => r.id === state.selectedRole?.id)
            if (updatedRole) {
                dispatch({
                    type: "merge",
                    payload: {
                        selectedRole: updatedRole,
                        selectedPermissions: getRolePermissionCodes(updatedRole),
                    },
                })
            }

            toast.success(t("dialog.success.UpdateRoleSuccess"))
        } catch (error) {
            console.error(error)
            toast.error(t("dialog.error.UpdateRoleFail"))
        } finally {
            dispatch({ type: "merge", payload: { isSubmitting: false } })
        }
    }

    const handleCancelPermissions = () => {
        if (state.selectedRole) {
            dispatch({
                type: "setSelectedPermissions",
                payload: state.selectedRole.Permissions.map((permission) => permission.code),
            })
        }
    }

    const hasPermissionsChanged = () => {
        if (!state.selectedRole) return false

        const currentPermissionCodes = state.selectedRole.Permissions.map((p) => p.code).sort()
        const newPermissionCodes = [...state.selectedPermissions].sort()

        return (
            currentPermissionCodes.length !== newPermissionCodes.length ||
            currentPermissionCodes.some((code, index) => code !== newPermissionCodes[index])
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            {/* Roles Panel */}
            <Card>
                <CardHeader className="flex flex-col justify-between space-y-0 pb-2">
                    <div className="flex flex-row items-center justify-between space-x-2 w-full">
                        <div className="flex flex-col">
                            <CardTitle>{t("roles")}</CardTitle>
                            {process.env.NEXT_PUBLIC_MAX_ROLE && (
                                <div className="text-sm text-muted-foreground">
                                    {state.roles.length} / {process.env.NEXT_PUBLIC_MAX_ROLE}
                                </div>
                            )}
                        </div>
                        <Button
                            size="sm"
                            onClick={handleCreateRole}
                            disabled={
                                !canCreateRole ||
                                (process.env.NEXT_PUBLIC_MAX_ROLE
                                    ? state.roles.length >= parseInt(process.env.NEXT_PUBLIC_MAX_ROLE)
                                    : false)
                            }
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            {t("newRole")}
                        </Button>
                    </div>
                    <div className="relative w-full">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t("search")}
                            value={state.searchQuery}
                            onChange={(e) => dispatch({ type: "merge", payload: { searchQuery: e.target.value } })}
                            className="pl-8"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-full pr-4">
                        <div>
                            {filteredRoles.map((role) => (
                                <div key={role.id}>
                                    <div
                                        className={`flex items-center space-x-2 p-2 m-1 rounded-md cursor-pointer ${
                                            state.selectedRole?.id === role.id ? "bg-primary/10" : "hover:bg-muted"
                                        }`}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => handleRoleSelect(role)}
                                        onDoubleClick={() => {
                                            if (!canEditRole) return
                                            handleEditRole(role)
                                        }}
                                        onKeyDown={(event) => {
                                            if (event.key === "Enter" || event.key === " ") {
                                                event.preventDefault()
                                                handleRoleSelect(role)
                                            }
                                        }}
                                    >
                                        <Checkbox
                                            checked={state.selectedRole?.id === role.id}
                                            onCheckedChange={() => handleRoleSelect(role)}
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium">{role.name}</div>
                                            <div className="text-sm text-muted-foreground">{role.description}</div>
                                        </div>
                                        {canEditRole && (
                                            <div className="flex gap-1">
                                                <Button
                                                    className="cursor-pointer"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        if (!canEditRole) return
                                                        handleEditRole(role)
                                                    }}
                                                    disabled={!canEditRole}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    className="cursor-pointer"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleDeleteRole(role)
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    <Separator className="my-0" />
                                </div>
                            ))}
                            {filteredRoles.length === 0 && state.searchQuery && (
                                <div className="text-center py-4 text-muted-foreground">
                                    {t("noRolesFoundSearch")}
                                </div>
                            )}
                            {state.roles.length === 0 && !state.searchQuery && (
                                <div className="text-center py-4 text-muted-foreground">{t("noRolesFound")}</div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Permissions Panel */}
            <Card>
                <CardHeader className="flex flex-col justify-between space-y-2 pb-2">
                    <div className="flex flex-row items-center justify-between space-x-2 w-full relative">
                        <CardTitle>{t("permissions")}</CardTitle>
                        {state.selectedRole && canEditRole && hasPermissionsChanged() && (
                            <div className="absolute right-0 space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCancelPermissions}
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    {t("cancel")}
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={handleSavePermissions}
                                    disabled={state.isSubmitting}
                                >
                                    <Check className="h-4 w-4 mr-2" />
                                    {t("save")}
                                </Button>
                            </div>
                        )}
                    </div>
                    {state.selectedRole && (
                        <div className="relative w-full">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t("searchPermissions")}
                                value={state.permissionSearchQuery}
                                onChange={(e) =>
                                    dispatch({
                                        type: "merge",
                                        payload: { permissionSearchQuery: e.target.value },
                                    })
                                }
                                className="pl-8"
                            />
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    {state.selectedRole ? (
                        <>
                            <div className="mb-4 p-3 bg-muted rounded-md">
                                <div className="font-medium">{t("assignPermissionsTo")}</div>
                                <div className="text-sm text-muted-foreground">{state.selectedRole.name}</div>
                            </div>
                            <ScrollArea className="h-full pr-4">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[180px]">{t("module")}</TableHead>
                                            {permissionActions.map((action) => (
                                                <TableHead key={action} className="text-center min-w-[120px]">
                                                    {getActionLabel(action)}
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {permissionModules.map((module) => (
                                            <TableRow key={module}>
                                                <TableCell>
                                                    <div className="font-medium">{getModuleLabel(module)}</div>
                                                    <Badge variant="outline" className="mt-1">
                                                        {module}
                                                    </Badge>
                                                </TableCell>
                                                {permissionActions.map((action) => {
                                                    const permissionCode = getPermissionCodeForCell(module, action)
                                                    const checkboxId = permissionCode ?? `${module}-${action}`
                                                    return (
                                                        <TableCell key={`${module}-${action}`} className="text-center">
                                                            {permissionCode ? (
                                                                <div className="flex flex-col items-center gap-1">
                                                                    <Checkbox
                                                                        id={checkboxId}
                                                                        checked={state.selectedPermissions.includes(
                                                                            permissionCode,
                                                                        )}
                                                                        onCheckedChange={() =>
                                                                            handlePermissionToggle(permissionCode)
                                                                        }
                                                                        className={`disabled:opacity-100 ${canEditRole ? "cursor-pointer" : "disabled:cursor-default"}`}
                                                                        disabled={!canEditRole}
                                                                    />
                                                                    <label
                                                                        htmlFor={checkboxId}
                                                                        className={`text-[11px] text-muted-foreground ${canEditRole ? "cursor-pointer" : "disabled:cursor-default"}`}
                                                                    >
                                                                        {permissionCode}
                                                                    </label>
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted-foreground text-xs">
                                                                    -
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                    )
                                                })}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                {permissionModules.length === 0 && state.permissionSearchQuery && (
                                    <div className="text-center py-4 text-muted-foreground">
                                        {t("noPermissionsFoundSearch")}
                                    </div>
                                )}
                                {permissionModules.length === 0 &&
                                    permissions.length === 0 &&
                                    !state.permissionSearchQuery && (
                                    <div className="text-center py-4 text-muted-foreground">
                                        {t("noPermissionsFound")}
                                    </div>
                                )}
                            </ScrollArea>
                        </>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            {t("selectRoleToManagePermissions")}
                        </div>
                    )}
                </CardContent>
            </Card>
            {(canCreateRole || canEditRole) && (
                <RoleDialog
                    open={state.isDialogOpen}
                    onOpenChange={(open) => dispatch({ type: "merge", payload: { isDialogOpen: open } })}
                    role={state.editingRole}
                    onClose={handleRoleDialogClose}
                />
            )}
        </div>
    )
}
