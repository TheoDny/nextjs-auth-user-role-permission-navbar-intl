export class NoEditSuperAdminUser extends Error {
    constructor() {
        super("Cannot modify the Super Admin user")
        this.name = "NoEditSuperAdminUser"
    }
}