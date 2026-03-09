import { SafeHandleActionError } from "./SafeHandleActionError"

export class NoEditSuperAdminRole extends SafeHandleActionError {
    constructor() {
        super("Cannot modify the Super Admin role")
        this.name = "NoEditSuperAdminRole"
    }
}
