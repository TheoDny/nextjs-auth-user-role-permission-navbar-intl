import { SafeHandleActionError } from "./SafeHandleActionError"

export class NoEditSeededEntity extends SafeHandleActionError {
    constructor() {
        super("Cannot modify a protected seeded entity")
        this.name = "NoEditSeededEntity"
    }
}
