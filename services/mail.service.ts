import { InvitationSignUp } from "@/emails/invitation-sign-up"
import ResetPassword from "@/emails/reset-password"
import { transporter } from "@/lib/mail"
import { render } from "@react-email/render"

export interface EmailOptions {
    to: string[]
    subject: string
    html: string
    attachments?: { filename: string; path: string }[]
}
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
async function sendEmail(options: EmailOptions) {
    let info: any = true
    if (process.env.MAILER_ACTIVE ?? true) {
        let mailOptions = {
            from: process.env.MAIL_EMAIL_USER,
            to: options.to.join(", "),
            subject: options.subject,
            html: options.html,
            attachments: options.attachments,
        }
        info = await transporter.sendMail(mailOptions)
    }
    return info
}

export async function sendResetPassword(email: string, resetLinkt: string) {
    const options: EmailOptions = {
        to: [email],
        subject: `${process.env.NEXT_PUBLIC_NAME_APP} - Reset Password`,
        html: await render(ResetPassword({ resetLink: resetLinkt, appUrl: appUrl })),
    }
    try {
        return sendEmail(options)
    } catch (error) {
        console.error(error)
        return false
    }
}

export async function sendInvitationSignUp(name: string, email: string, inviteLink: string) {
    try {
        const options: EmailOptions = {
            to: [email],
            subject: `${process.env.NEXT_PUBLIC_NAME_APP} - Invitation Sign Up`,
            html: await render(InvitationSignUp({ name, inviteLink: inviteLink, appUrl: appUrl })),
        }
        return sendEmail(options)
    } catch (error) {
        console.error("Failed to send invitation email:", error)
        return false
    }
}
