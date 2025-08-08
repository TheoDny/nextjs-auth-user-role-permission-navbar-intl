export class UnauthorizedNoActiveSessionError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "UnauthorizedNoActiveSessionError"
    }
}
