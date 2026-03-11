import { SafeHandleActionError } from "./SafeHandleActionError"

export class DeleteRoleUserAssignedError extends SafeHandleActionError {
    constructor() {
        super("Cannot delete a role that is assigned to users")
        this.name = "DeleteRoleUserAssignedError"
    }
}
