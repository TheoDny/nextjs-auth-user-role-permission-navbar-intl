"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { createRoleAction, updateRoleAction } from "@/actions/role.action"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RoleModel as Role } from "@/prisma/generated/models/Role"
import { RolePermissions } from "@/types/role.type"

const roleSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    description: z.string().optional(),
})

type RoleFormValues = z.infer<typeof roleSchema>

interface RoleDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    role: Role | null
    onClose: (role?: RolePermissions) => void
}

export function RoleDialog({ open, onOpenChange, role, onClose }: RoleDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const t = useTranslations("RoleManagement.dialog")
    const tCommon = useTranslations("Common")

    const form = useForm<RoleFormValues>({
        resolver: zodResolver(roleSchema),
        defaultValues: {
            name: role?.name || "",
            description: role?.description || "",
        },
    })

    const isSuperAdmin = role?.name === "Super Admin"

    useEffect(() => {
        if (role) {
            form.reset({
                name: role.name,
                description: role.description || "",
            })
        } else {
            form.reset({
                name: "",
                description: "",
            })
        }
    }, [open, role, form])

    const handleClose = () => {
        form.reset()
        onOpenChange(false)
        onClose()
    }

    const onSubmit = async (values: RoleFormValues) => {
        if (isSuperAdmin) {
            toast.error(t("error.cannotModifySuperAdmin"))
            return
        }

        setIsSubmitting(true)

        try {
            let result

            if (role) {
                // Update existing role
                result = await updateRoleAction({
                    id: role.id,
                    name: values.name,
                    description: values.description || "",
                })
            } else {
                // Create new role
                result = await createRoleAction({
                    name: values.name,
                    description: values.description || "",
                })
            }

            if (result?.serverError) {
                return toast.error(role ? t("error.UpdateRoleFail") : t("error.CreateRoleFail"))
            } else if (result?.validationErrors) {
                return toast.error(role ? t("error.UpdateRoleFail") : t("error.CreateRoleFail"))
            } else if (!result?.data) {
                return toast.error(role ? t("error.UpdateRoleFail") : t("error.CreateRoleFail"))
            }

            if (role) {
                toast.success(t("success.UpdateRoleSuccess"))
            } else {
                toast.success(t("success.CreateRoleSuccess"))
            }

            form.reset()
            onOpenChange(false)
            onClose(result.data)
        } catch (error) {
            console.error(error)
            toast.error(role ? "Failed to update role" : "Failed to create role")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog
            open={open}
            onOpenChange={onOpenChange}
        >
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{role ? t("edit") : t("create")}</DialogTitle>
                    <DialogDescription>
                        {role ? t("editDescription") : t("createDescription")}
                        {isSuperAdmin && (
                            <div className="text-orange-600 text-sm mt-2">
                                ⚠️ {t("error.cannotModifySuperAdmin")}
                            </div>
                        )}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("name")}</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder={t("namePlaceholder")}
                                            disabled={isSuperAdmin}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("description")}</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder={t("descriptionPlaceholder")}
                                            className="resize-none"
                                            disabled={isSuperAdmin}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                            >
                                {tCommon("cancel")}
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting || isSuperAdmin}
                            >
                                {isSubmitting ? tCommon("saving") : role ? tCommon("update") : tCommon("create")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
