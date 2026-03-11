import { SafeHandleActionError } from "./SafeHandleActionError"

export class UserNotFound extends SafeHandleActionError {
    constructor() {
        super("User not found")
        this.name = "UserNotFound"
    }
}