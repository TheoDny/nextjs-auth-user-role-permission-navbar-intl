import { SafeHandleActionError } from "./SafeHandleActionError"

export class SendInvitationEmailError extends SafeHandleActionError {
    constructor() {
        super("Failed to send invitation email, user deleted")
        this.name = "SendInvitationEmailError"
    }
}