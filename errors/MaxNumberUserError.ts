import { SafeHandleActionError } from "./SafeHandleActionError"

export class MaxNumberUserError extends SafeHandleActionError {
    constructor(maxNumber: number) {
        super(`Maximum number of users reached (${maxNumber})`)
        this.name = "MaxNumberUserError"
    }
}