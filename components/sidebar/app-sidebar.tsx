"use client"

import * as React from "react"

import { NavMain } from "@/components/sidebar/nav-main"
import { NavUser } from "@/components/sidebar/nav-user"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { useIsMobile } from "@/hooks/use-mobile"
import { Menu } from "lucide-react"
import Link from "next/link"

export function AppSidebar({ data, ...props }: React.ComponentProps<typeof Sidebar> & { data: any }) {
    const isMobile = useIsMobile()
    
    if (isMobile) {
        return (
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="secondary" size="icon" className="fixed top-2 left-2 z-40">
                        <Menu className="h-4 w-4" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-[280px]">
                    <div className="flex h-full flex-col">
                        <div className="p-4">
                            <Link
                                href="/"
                                prefetch={false}
                                className="flex flex-row items-center gap-2"
                            >
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                    {data.header.logo}
                                </div>
                                <div className="flex flex-col gap-0.5 leading-none">
                                    <span className="font-semibold">{data.header.name}</span>
                                </div>
                            </Link>
                        </div>
                        <Separator />
                        <div className="flex-1 overflow-auto p-2">
                            <NavMain groups={data.groups} />
                        </div>
                        <Separator />
                        <div className="p-2">
                            <NavUser user={data.user} />
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        )
    }

    return (
        <Sidebar
            collapsible="icon"
            {...props}
        >
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem className="flex flex-row justify-between">
                        <SidebarMenuButton
                            size="lg"
                            asChild
                        >
                            <div className={"flex justify-between"}>
                                <Link
                                    href="/"
                                    prefetch={false}
                                    className="flex flex-row items-center gap-2 p-2"
                                >
                                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                        {data.header.logo}
                                    </div>
                                    <div className="flex flex-col gap-0.5 leading-none">
                                        <span className="font-semibold">{data.header.name}</span>
                                    </div>
                                </Link>
                            </div>
                        </SidebarMenuButton>
                        <SidebarTrigger className="ml-2 self-center" />
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>{<NavMain groups={data.groups} />}</SidebarContent>
            <Separator />
            <SidebarFooter>
                <NavUser user={data.user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
