import { LucideIcon } from "lucide-react"
import { ReactNode } from "react"

export type NavigationItemType = LinkItemType | MenuItemType

export type MenuItemType = {
    title: string
    icon?: LucideIcon
    subMenuItems?: LinkItemType[]
    requiredPermission?: string[]
}

export type LinkItemType = {
    title: string
    path: string
    icon?: LucideIcon
    requiredPermission?: string[]
}

export type NavigationType = {
    user: NavigationUserType
    header: NavigationHeaderType
    groups: NavigationGroupType[]
}

export type NavigationUserType = {
    name: string
    avatar: string
    Entities: { id: string; name: string }[]
    EntitySelected: { id: string; name: string }
}

export type NavigationHeaderType = {
    name: string
    url?: string
    logo: ReactNode
}

export type NavigationGroupItemType = {
    title: string
    url?: string
    icon?: ReactNode
    isActive?: boolean
}

export type NavigationGroupType = {
    title: string
    url?: string
    icon?: ReactNode
    items: NavigationGroupItemType[]
}
