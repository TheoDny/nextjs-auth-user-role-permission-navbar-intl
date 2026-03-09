import { SafeHandleActionError } from "./SafeHandleActionError";

export class PasswordsMatchingError extends SafeHandleActionError {
    constructor() {
        super("Passwords do not match")
        this.name = "PasswordsMatchingError"
    }
}