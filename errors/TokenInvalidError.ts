import { SafeHandleActionError } from "./SafeHandleActionError";

export class TokenInvalidError extends SafeHandleActionError {
    constructor() {
        super("Token invalid")
        this.name = "TokenInvalidError"
    }
}