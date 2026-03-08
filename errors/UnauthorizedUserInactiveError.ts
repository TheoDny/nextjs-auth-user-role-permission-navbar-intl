import { UnauthorizedError } from "./UnauthorizedError"

export class UnauthorizedUserInactiveError extends UnauthorizedError {
    constructor(userName: string) {
        super(`Unauthorized: User ${userName} is inactive`)
        this.name = "UnauthorizedUserInactiveError"
    }
}
