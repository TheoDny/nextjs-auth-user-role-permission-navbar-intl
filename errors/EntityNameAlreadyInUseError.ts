import { SafeHandleActionError } from "./SafeHandleActionError"

export class EntityNameAlreadyInUseError extends SafeHandleActionError {
    constructor() {
        super("An entity with this name already exists")
        this.name = "EntityNameAlreadyInUseError"
    }
}
