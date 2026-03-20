import { SafeHandleActionError } from "./SafeHandleActionError"

export class MaxNumberEntityError extends SafeHandleActionError {
    constructor(maxEntities: number) {
        super(`Maximum number of entities reached (${maxEntities})`)
        this.name = "MaxNumberEntityError"
    }
}
