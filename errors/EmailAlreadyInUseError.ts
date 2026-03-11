import { SafeHandleActionError } from "./SafeHandleActionError"

export class EmailAlreadyInUseError extends SafeHandleActionError {
    constructor() {
        super("Email is already in use by another account")
        this.name = "EmailAlreadyInUseError"
    }
}