"use client"

import { changeEntitySelectedAction } from "@/actions/user.action"
import { ModeToggle } from "@/components/select/select-theme"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"
import { signOut } from "@/lib/auth-client"
import { EntityModel as Entity } from "@/prisma/generated/models/Entity"
import { Building, ChevronsUpDown, LogOut, SquareUserRound } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { toast } from "sonner"
import { Separator } from "../ui/separator"

export function NavUser({
    user,
}: {
    user: {
        name: string
        avatar: string
        Entities: Entity[]
        EntitySelected: Entity
    }
}) {
    const { isMobile, open } = useSidebar()
    const t = useTranslations("Navigation")
    const tAccount = useTranslations("Account.profile")

    const handleEntityChange = async (entityId: string) => {
        try {
            await changeEntitySelectedAction({ entityId })
            // Reload the page to reflect the changes
            window.location.reload()
        } catch (error) {
            console.error(error)
            toast.error("Failed to change entity")
        }
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton className="cursor-pointer h-12">
                            <Building className="h-4 w-4" />
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">
                                    {user.EntitySelected ? user.EntitySelected.name : tAccount("noEntity")}
                                </span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="px-2 py-1.5">
                            {tAccount("availableEntities")}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            {user.Entities.map((entity) => (
                                <DropdownMenuItem
                                    key={entity.id}
                                    onClick={() => handleEntityChange(entity.id)}
                                    className="cursor-pointer"
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <span>{entity.name}</span>
                                        {user.EntitySelected.id === entity.id && (
                                            <Badge
                                                variant="secondary"
                                                className="ml-2"
                                            >
                                                {tAccount("selectedEntity")}
                                            </Badge>
                                        )}
                                    </div>
                                </DropdownMenuItem>
                            ))}
                            {user.Entities.length === 0 && (
                                <DropdownMenuItem disabled>{tAccount("noEntity")}</DropdownMenuItem>
                            )}
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
            <Separator />
            <SidebarMenuItem className={"flex gap-2 " + (open ? "flex-row" : "flex-col-reverse")}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="cursor-pointer data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarImage
                                    src={user.avatar}
                                    alt={user.name}
                                />
                                <AvatarFallback className="rounded-lg">
                                    {user.name
                                        .split(" ")
                                        .map((n: string) => n[0].toUpperCase())
                                        .join("")
                                        .slice(0, 3)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">{user.name}</span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarImage
                                        src={user.avatar}
                                        alt={user.name}
                                    />
                                    <AvatarFallback className="rounded-lg">
                                        {user.name
                                            .split(" ")
                                            .map((n: string) => n[0].toUpperCase())
                                            .join("")
                                            .slice(0, 3)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">{user.name}</span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem>
                                <Link
                                    href={"/account"}
                                    prefetch={false}
                                    className="flex flex-row align-middle gap-2"
                                >
                                    <SquareUserRound className={"self-center"} />
                                    {t("account")}
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => signOut()}>
                            <form className="flex flex-row align-middle gap-2 w-full">
                                <Button
                                    className="cursor-pointer w-full"
                                    type="submit"
                                    formAction={async () => {
                                        await signOut()
                                        window.location.href = "/"
                                    }}
                                >
                                    <LogOut />
                                    {t("logout")}
                                </Button>
                            </form>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <ModeToggle size={open ? "default" : "icon"} />
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
