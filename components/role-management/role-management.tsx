"use client"

import { Check, Pencil, Plus, Trash2, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { getPermissionsAction } from "@/actions/permission-actions"
import { assignPermissionsToRoleAction, deleteRoleAction, getRolesAction } from "@/actions/role-actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { roleSuperAdmin } from "@/prisma/data-seed"
import { Permission, Role } from "@/prisma/generated"
import { useConfirm } from "@/provider/ConfirmationProvider"
import { RolePermissions } from "@/types/role.type"
import { RoleDialog } from "./role-dialog"

export function RoleManagement() {
    const [roles, setRoles] = useState<RolePermissions[]>([])
    const [permissions, setPermissions] = useState<Permission[]>([])
    const [selectedRole, setSelectedRole] = useState<RolePermissions | null>(null)
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingRole, setEditingRole] = useState<Role | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const t = useTranslations("RoleManagement")
    const tPermissions = useTranslations("Permissions")

    const { confirm } = useConfirm()

    useEffect(() => {
        const loadData = async () => {
            try {
                const rolesData = await getRolesAction()
                setRoles(rolesData)

                const permissionsData = await getPermissionsAction()
                setPermissions(permissionsData)
            } catch (error) {
                console.error(error)
                toast.error("Failed to load data")
            }
        }

        loadData()
    }, [])

    useEffect(() => {
        if (selectedRole) {
            setSelectedPermissions(selectedRole.Permissions.map((permission) => permission.code))
        } else {
            setSelectedPermissions([])
        }
    }, [selectedRole])

    const handleRoleSelect = (role: RolePermissions) => {
        setSelectedRole(role)
    }

    const handleCreateRole = () => {
        setEditingRole(null)
        setIsDialogOpen(true)
    }

    const handleEditRole = (role: Role) => {
        if (role.id === roleSuperAdmin.id) {
            toast.error(t("dialog.error.cannotModifySuperAdmin"))
            return
        }
        setEditingRole(role)
        setIsDialogOpen(true)
    }

    const handleDeleteRole = async (role: Role) => {
        if (role.id === roleSuperAdmin.id) {
            toast.error(t("dialog.error.cannotDeleteSuperAdmin"))
            return
        }

        if (!(await confirm(t("confirmDelete")))) {
            return
        }

        setIsDeleting(true)

        try {
            const result = await deleteRoleAction({ id: role.id })

            if (result?.serverError) {
                console.error(result?.serverError)
                return toast.error(t("dialog.error.DeleteRoleFail"))
            } else if (result?.validationErrors) {
                console.error(result?.validationErrors)
                return toast.error(t("dialog.error.DeleteRoleFail"))
            } else if (!result?.data) {
                console.error("No data returned")
                return toast.error(t("dialog.error.DeleteRoleFail"))
            }

            toast.success(t("dialog.success.DeleteRoleSuccess"))

            // Clear selection if deleted role was selected
            if (selectedRole?.id === role.id) {
                setSelectedRole(null)
            }

            // Refresh the roles list
            const rolesData = await getRolesAction()
            setRoles(rolesData)
        } catch (error) {
            console.error(error)
            toast.error(t("dialog.error.DeleteRoleFail"))
        } finally {
            setIsDeleting(false)
        }
    }

    const handleRoleDialogClose = (newRole?: RolePermissions) => {
        setIsDialogOpen(false)

        if (newRole) {
            // If we're editing the currently selected role, update the selection
            if (selectedRole && selectedRole.id === newRole.id) {
                setSelectedRole(newRole)
            }

            // Refresh the roles list
            getRolesAction().then(setRoles)
        }
    }

    const handlePermissionToggle = (permissionCode: string) => {
        setSelectedPermissions((current) => {
            if (current.includes(permissionCode)) {
                return current.filter((id) => id !== permissionCode)
            } else {
                return [...current, permissionCode]
            }
        })
    }

    const handleSavePermissions = async () => {
        if (!selectedRole) return

        if (selectedRole.id === roleSuperAdmin.id) {
            toast.error(t("dialog.error.cannotModifySuperAdmin"))
            return
        }

        setIsSubmitting(true)

        try {
            await assignPermissionsToRoleAction({
                roleId: selectedRole.id,
                permissionCodes: selectedPermissions,
            })

            // Refresh the roles list
            const rolesData = await getRolesAction()
            setRoles(rolesData)

            // Update the selected role
            const updatedRole = rolesData.find((r) => r.id === selectedRole.id)
            if (updatedRole) {
                setSelectedRole(updatedRole)
            }

            toast.success("Permissions updated successfully")
        } catch (error) {
            console.error(error)
            toast.error("Failed to update permissions")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCancelPermissions = () => {
        if (selectedRole) {
            setSelectedPermissions(selectedRole.Permissions.map((permission) => permission.code))
        }
    }

    const hasPermissionsChanged = () => {
        if (!selectedRole) return false

        const currentPermissionCodes = selectedRole.Permissions.map((p) => p.code).sort()
        const newPermissionCodes = [...selectedPermissions].sort()

        return (
            currentPermissionCodes.length !== newPermissionCodes.length ||
            currentPermissionCodes.some((code, index) => code !== newPermissionCodes[index])
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            {/* Roles Panel */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex flex-col">
                        <CardTitle>{t("roles")}</CardTitle>
                        {process.env.NEXT_PUBLIC_MAX_ROLE && (
                            <div className="text-sm text-muted-foreground">
                                {roles.length} / {process.env.NEXT_PUBLIC_MAX_ROLE}
                            </div>
                        )}
                    </div>
                    <Button
                        size="sm"
                        onClick={handleCreateRole}
                        disabled={
                            process.env.NEXT_PUBLIC_MAX_ROLE
                                ? roles.length >= parseInt(process.env.NEXT_PUBLIC_MAX_ROLE)
                                : false
                        }
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        {t("newRole")}
                    </Button>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-full pr-4">
                        <div>
                            {roles.map((role) => (
                                <div key={role.id}>
                                    <div
                                        className={`flex items-center space-x-2 p-2 m-1 rounded-md cursor-pointer ${
                                            selectedRole?.id === role.id ? "bg-primary/10" : "hover:bg-muted"
                                        }`}
                                        onClick={() => handleRoleSelect(role)}
                                        onDoubleClick={() => handleEditRole(role)}
                                    >
                                        <Checkbox
                                            checked={selectedRole?.id === role.id}
                                            onCheckedChange={() => handleRoleSelect(role)}
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium">{role.name}</div>
                                            <div className="text-sm text-muted-foreground">{role.description}</div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleEditRole(role)
                                                }}
                                                disabled={role.name === "Super Admin"}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDeleteRole(role)
                                                }}
                                                disabled={role.name === "Super Admin" || isDeleting}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <Separator className="my-0" />
                                </div>
                            ))}
                            {roles.length === 0 && (
                                <div className="text-center py-4 text-muted-foreground">{t("noRolesFound")}</div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Permissions Panel */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                    <CardTitle>{t("permissions")}</CardTitle>
                    {selectedRole && hasPermissionsChanged() && (
                        <div className="flex space-x-2 absolute right-4">
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
                                disabled={isSubmitting || selectedRole.name === "Super Admin"}
                            >
                                <Check className="h-4 w-4 mr-2" />
                                {t("save")}
                            </Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    {selectedRole ? (
                        <>
                            <div className="mb-4 p-3 bg-muted rounded-md">
                                <div className="font-medium">{t("assignPermissionsTo")}</div>
                                <div className="text-sm text-muted-foreground">{selectedRole.name}</div>
                                {selectedRole.name === "Super Admin" && (
                                    <div className="text-xs text-orange-600 mt-1">
                                        {t("dialog.error.cannotModifySuperAdmin")}
                                    </div>
                                )}
                            </div>
                            <ScrollArea className="h-full pr-4">
                                <div className="space-y-2">
                                    {permissions.map((permission) => (
                                        <div
                                            key={permission.code}
                                            className="flex items-start space-x-2 p-2 rounded-md hover:bg-muted"
                                        >
                                            <Checkbox
                                                id={permission.code}
                                                checked={selectedPermissions.includes(permission.code)}
                                                onCheckedChange={() => handlePermissionToggle(permission.code)}
                                                disabled={selectedRole.name === "Super Admin"}
                                            />
                                            <div className="flex-1">
                                                <label
                                                    htmlFor={permission.code}
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                >
                                                    {permission.code}
                                                </label>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    {tPermissions(permission.code)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {permissions.length === 0 && (
                                        <div className="text-center py-4 text-muted-foreground">
                                            {t("noPermissionsFound")}
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            {t("selectRoleToManagePermissions")}
                        </div>
                    )}
                </CardContent>
            </Card>

            <RoleDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                role={editingRole}
                onClose={handleRoleDialogClose}
            />
        </div>
    )
}
