import { SafeHandleActionError } from "./SafeHandleActionError"

export class CannotDeleteYourselfError extends SafeHandleActionError {
    constructor() {
        super("You cannot delete yourself")
        this.name = "CannotDeleteYourselfError"
    }
}