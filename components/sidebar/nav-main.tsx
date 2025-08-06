"use client"

import { Separator } from "@/components/ui/separator"
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton } from "@/components/ui/sidebar"
import Link from "next/link"
import { ReactNode } from "react"

export function NavMain({
    groups,
}: {
    groups: {
        title: string
        url: string
        icon?: ReactNode
        items?: {
            title: string
            url: string
            isActive?: boolean
            icon?: ReactNode
        }[]
    }[]
}) {
    return (
        <>
            {groups.map((group) => (
                <SidebarGroup key={group.title}>
                    <Separator className={"w-10/12 self-center mb-2"} />
                    <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
                    <SidebarMenu>
                        {group.items?.map((item) => (
                            <SidebarMenuButton
                                key={item.title}
                                className={item.isActive ? "" : ""}
                                asChild
                                tooltip={item.title}
                            >
                                <Link
                                    href={item.url}
                                    prefetch={false}
                                >
                                    {item.icon}
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            ))}
        </>
    )
}
