export class UnauthorizedMissingPermission extends Error {
    code = "missingPermission"

    constructor(message: string) {
        super(message)
        this.name = "UnauthorizedMissingPermission"
    }
}
