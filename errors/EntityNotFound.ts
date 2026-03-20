import { SafeHandleActionError } from "./SafeHandleActionError"

export class EntityNotFound extends SafeHandleActionError {
    constructor() {
        super("Entity not found")
        this.name = "EntityNotFound"
    }
}
