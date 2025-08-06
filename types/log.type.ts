export type DataLogUserCreate = {
    type: "user_create"
    info: {
        user: {
            id: string
            name: string
        }
    }
    userId: string // the id of th user that do the action
    entityId: undefined
}

export type DataLogUserUpdate = {
    type: "user_update"
    info: {
        user: {
            id: string
            name: string
        }
    }
    userId: string
    entityId: undefined
}

export type DataLogUserSetRole = {
    type: "user_set_role"
    info: {
        user: {
            id: string
            name: string
        }
    }
    userId: string
    entityId: undefined
}

export type DataLogUserSetEntity = {
    type: "user_set_entity"
    info: {
        user: {
            id: string
            name: string
        }
    }
    userId: string
    entityId: undefined
}

export type DataLogUserDisable = {
    type: "user_disable"
    info: {
        user: {
            id: string
            name: string
        }
    }
    userId: string
    entityId: undefined
}

export type DataLogUserEmailVerified = {
    type: "user_email_verified"
    info: {
        user: {
            id: string
            name: string
        }
    }
    userId: string
    entityId: undefined
}

export type DataLogRoleCreate = {
    type: "role_create"
    info: {
        role: {
            id: string
            name: string
        }
    }
    userId: string
    entityId: undefined
}

export type DataLogRoleUpdate = {
    type: "role_update"
    info: {
        role: {
            id: string
            name: string
        }
    }
    userId: string
    entityId: undefined
}

export type DataLogRoleDelete = {
    type: "role_delete"
    info: {
        role: {
            id: string
            name: string
        }
    }
    userId: string
    entityId: undefined
}

export type DataLogRoleSetPermission = {
    type: "role_set_permission"
    info: {
        role: {
            id: string
            name: string
        }
    }
    userId: string
    entityId: undefined
}

export type DataLogEntityUpdate = {
    type: "entity_update"
    info: {
        entity: {
            id: string
            name: string
        }
    }
    userId: string
    entityId: string
}

export type DataLogEntityDisable = {
    type: "entity_disable"
    info: {
        entity: {
            id: string
            name: string
        }
    }
    userId: string
    entityId: string
}

export type DataLogEntityEnable = {
    type: "entity_enable"
    info: {
        entity: {
            id: string
            name: string
        }
    }
    userId: string
    entityId: string
}

export type DataLogUserEnable = {
    type: "user_enable"
    info: {
        user: {
            id: string
            name: string
        }
    }
    userId: string
    entityId: undefined
}

export type LogEntry = {
    id: string
    type: string
    info: any
    userId: string
    entityId?: string
    createdAt: Date
    user: {
        id: string
        name: string
    }
    entity?: {
        id: string
        name: string
    }
}

export type DataLog =
    | DataLogUserCreate
    | DataLogUserUpdate
    | DataLogUserSetRole
    | DataLogUserSetEntity
    | DataLogUserDisable
    | DataLogUserEnable
    | DataLogUserEmailVerified
    | DataLogRoleCreate
    | DataLogRoleUpdate
    | DataLogRoleDelete
    | DataLogRoleSetPermission
    | DataLogEntityUpdate
    | DataLogEntityDisable
    | DataLogEntityEnable
