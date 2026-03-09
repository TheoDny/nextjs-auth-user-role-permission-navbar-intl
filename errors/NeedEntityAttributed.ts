import { SafeHandleActionError } from "./SafeHandleActionError";

export class NeedEntityAttributedError extends SafeHandleActionError {
    constructor() {
        super("A user must be attributed to at least one entity")
        this.name = "NeedEntityAttributedError"
    }
}