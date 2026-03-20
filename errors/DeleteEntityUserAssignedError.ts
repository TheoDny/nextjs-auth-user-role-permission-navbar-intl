import { SafeHandleActionError } from "./SafeHandleActionError"

export class DeleteEntityUserAssignedError extends SafeHandleActionError {
    constructor() {
        super("Cannot delete an entity that is assigned to users")
        this.name = "DeleteEntityUserAssignedError"
    }
}
