export type PermissionSeed = {
    code: string;    
}

export const permissions = [
    { code: "user_create" },
    { code: "user_read" },
    { code: "user_edit" },
    { code: "role_create" },
    { code: "role_read" },
    { code: "role_edit" },
    { code: "entity_create" },
    { code: "entity_read" },
    { code: "entity_edit" },
    { code: "log_read" },
]