"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { createEntityAction, updateEntityAction } from "@/actions/entity.action"
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
import { handleSafeActionResult } from "@/lib/utils.client"
import { EntityModel as Entity } from "@/prisma/generated/models/Entity"
import { EntityUsers } from "@/types/entity.type"

const entitySchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
})

type EntityFormValues = z.infer<typeof entitySchema>

interface EntityDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    entity: Entity | null
    onClose: (entity?: EntityUsers) => void
}

export function EntityDialog({ open, onOpenChange, entity, onClose }: EntityDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const t = useTranslations("EntityManagement.dialog")
    const tErrors = useTranslations("Errors")
    const tCommon = useTranslations("Common")

    const form = useForm<EntityFormValues>({
        resolver: zodResolver(entitySchema),
        defaultValues: {
            name: entity?.name || "",
        },
    })

    const resetFormValues = () => {
        if (entity) {
            form.reset({
                name: entity.name,
            })
            return
        }
        form.reset({
            name: "",
        })
    }

    useEffect(() => {
        resetFormValues()
    }, [entity])

    const handleOpenChange = (nextOpen: boolean) => {
        if (nextOpen) {
            resetFormValues()
        }
        onOpenChange(nextOpen)
    }

    const handleClose = () => {
        resetFormValues()
        handleOpenChange(false)
        onClose()
    }

    const onSubmit = async (values: EntityFormValues) => {
        setIsSubmitting(true)

        try {
            const result = entity
                ? await updateEntityAction({
                      id: entity.id,
                      name: values.name,
                  })
                : await createEntityAction({
                      name: values.name,
                  })

            const handledResult = handleSafeActionResult(result, {
                error: toast.error,
                t: tErrors,
                fallbackErrorMessage: entity ? tErrors("UpdateEntityFail") : tErrors("CreateEntityFail"),
            })
            if (!handledResult.ok) return

            toast.success(entity ? t("success.UpdateEntitySuccess") : t("success.CreateEntitySuccess"))

            form.reset()
            handleOpenChange(false)
            onClose(handledResult.data)
        } catch (error) {
            console.error(error)
            toast.error(entity ? tErrors("UpdateEntityFail") : tErrors("CreateEntityFail"))
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog
            open={open}
            onOpenChange={handleOpenChange}
        >
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{entity ? t("edit") : t("create")}</DialogTitle>
                    <DialogDescription>
                        {entity ? t("editDescription") : t("createDescription")}
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
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? tCommon("saving") : entity ? tCommon("update") : tCommon("create")}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

