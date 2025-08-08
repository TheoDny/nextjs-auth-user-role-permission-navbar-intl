export class DeleteRoleUserAssignedError extends Error {
    code = "roleHasUsers"

    constructor(message: string) {
        super(message)
        this.name = "DeleteRoleUserAssignedError"
    }
}
