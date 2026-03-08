import { UnauthorizedError } from "./UnauthorizedError"

export class UnauthorizedMissingPermissionError extends UnauthorizedError {
    constructor(permissionName?: string) {
        super("Unauthorized: Missing permission" + permissionName)
        this.name = "UnauthorizedMissingPermissionError"
    }
}
