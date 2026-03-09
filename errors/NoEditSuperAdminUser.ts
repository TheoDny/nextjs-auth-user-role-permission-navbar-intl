import { SafeHandleActionError } from "./SafeHandleActionError"

export class NoEditSuperAdminUser extends SafeHandleActionError {
    constructor() {
        super("Cannot modify the Super Admin user")
        this.name = "NoEditSuperAdminUser"
    }
}
