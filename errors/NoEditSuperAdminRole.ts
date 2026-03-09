export class NoEditSuperAdminRole extends Error {
    constructor() {
        super("Cannot modify the Super Admin role")
        this.name = "NoEditSuperAdminRole"
    }
}