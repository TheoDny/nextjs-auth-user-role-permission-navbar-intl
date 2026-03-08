import { UnauthorizedError } from "./UnauthorizedError";

export class UnauthorizedNoSessionError extends UnauthorizedError {
    constructor() {
        super("Unauthorized: No session found")
        this.name = "UnauthorizedNoSessionError"
    }
}
