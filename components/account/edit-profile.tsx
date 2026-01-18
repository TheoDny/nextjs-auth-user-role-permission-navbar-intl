"use client"

import { updateProfileAction } from "@/actions/user.action"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { LoaderCircle, Pencil, Upload } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

// Define the profile schema with validation
const profileSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }),
    email: z.string().min(1, { message: "Email is required" }).email({ message: "Must be a valid email address" }),
    image: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

interface EditProfileProps {
    currentName: string
    currentEmail: string
    currentImage?: string | null
}

export function EditProfile({ currentName, currentEmail, currentImage }: EditProfileProps) {
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const t = useTranslations("Account")
    const tCommon = useTranslations("Common")
    const [imagePreview, setImagePreview] = useState<string | null>(currentImage || null)

    // Form setup with validation
    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: currentName,
            email: currentEmail,
            image: currentImage || "",
        },
    })

    // Image upload handler
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Handle only image files
        if (!file.type.startsWith("image/")) {
            toast.error(t("profileUpdate.imageTypeError"))
            return
        }

        // Create a preview and resize image
        const reader = new FileReader()
        reader.onload = (event) => {
            const img = new Image()
            img.onload = () => {
                // Calculate dimensions while maintaining aspect ratio
                let width = img.width
                let height = img.height
                const maxSize = 128

                if (width > height) {
                    if (width > maxSize) {
                        height = Math.round((height * maxSize) / width)
                        width = maxSize
                    }
                } else {
                    if (height > maxSize) {
                        width = Math.round((width * maxSize) / height)
                        height = maxSize
                    }
                }

                // Create canvas to resize image
                const canvas = document.createElement("canvas")
                canvas.width = width
                canvas.height = height
                const ctx = canvas.getContext("2d")
                ctx?.drawImage(img, 0, 0, width, height)

                // Get resized image as data URL
                const resizedImage = canvas.toDataURL(file.type)
                setImagePreview(resizedImage)
                form.setValue("image", resizedImage)
            }
            img.src = event.target?.result as string
        }
        reader.readAsDataURL(file)
    }

    // Form submission handler
    const onSubmit = async (values: ProfileFormValues) => {
        if (values.name === currentName && values.email === currentEmail && values.image === currentImage) {
            setOpen(false)
            return
        }

        setIsSubmitting(true)

        try {
            const result = await updateProfileAction({
                name: values.name,
                email: values.email,
                image: values.image,
            })

            if (result?.serverError) {
                return toast.error(t("profileUpdate.error"))
            } else if (result?.validationErrors) {
                return toast.error(t("profileUpdate.error"))
            } else if (!result?.data) {
                return toast.error(t("profileUpdate.error"))
            }

            toast.success(t("profileUpdate.success"))

            // Force page refresh to show updated profile
            window.location.reload()
        } catch (error) {
            console.error("Failed to update profile:", error)
            toast.error(t("profileUpdate.error"))
        } finally {
            setIsSubmitting(false)
        }
    }

    const getInitials = (name: string) => {
        return (
            name
                .split(" ")
                .map((n) => n[0]?.toUpperCase())
                .join("")
                .slice(0, 2) || "U"
        )
    }

    return (
        <Dialog
            open={open}
            onOpenChange={setOpen}
        >
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                >
                    <Pencil className="h-4 w-4 mr-2" />
                    {t("profileUpdate.editButton")}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{t("profileUpdate.title")}</DialogTitle>
                    <DialogDescription>{t("profileUpdate.description")}</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4 pt-4"
                    >
                        <div className="flex justify-center mb-6">
                            <div className="relative">
                                <Avatar className="h-24 w-24">
                                    <AvatarImage
                                        src={imagePreview || ""}
                                        alt={form.getValues("name")}
                                    />
                                    <AvatarFallback className="text-xl">
                                        {getInitials(form.getValues("name"))}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="absolute bottom-0 right-0">
                                    <label
                                        htmlFor="image-upload"
                                        className="cursor-pointer"
                                    >
                                        <div className="rounded-full bg-primary p-2 shadow-sm">
                                            <Upload className="h-4 w-4 text-primary-foreground" />
                                        </div>
                                    </label>
                                    <input
                                        id="image-upload"
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("profileUpdate.nameLabel")}</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t("profileUpdate.emailLabel")}</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="email@example.com"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                disabled={isSubmitting}
                            >
                                {tCommon("cancel")}
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                        {tCommon("saving")}
                                    </>
                                ) : (
                                    tCommon("save")
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
