import { SafeHandleActionError } from "./SafeHandleActionError"

export class EntityAccessDeniedError extends SafeHandleActionError {
    constructor() {
        super("You can only manage entities you own")
        this.name = "EntityAccessDeniedError"
    }
}
