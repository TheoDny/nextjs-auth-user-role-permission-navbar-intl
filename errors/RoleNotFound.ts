import { SafeHandleActionError } from "./SafeHandleActionError"

export class RoleNotFound extends SafeHandleActionError {
    constructor() {
        super("Role not found")
        this.name = "RoleNotFound"
    }
}