import InvitationSignUp from "@/emails/invitation-sign-up"
import ResetPassword from "@/emails/reset-password"
import { transporter } from "@/lib/mail"
import { render } from "@react-email/render"
import { getTranslations } from "next-intl/server"

interface EmailOptions {
    to: string[]
    subject: string
    html: string
    attachments?: { filename: string; path: string }[]
}

const appName = process.env.NEXT_PUBLIC_NAME_APP ?? "NAME_APP"
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
    const t = await getTranslations("Emails.resetPassword")
    const options: EmailOptions = {
        to: [email],
        subject: t("subject", { appName: appName }),
        html: await render(ResetPassword({ resetLink: resetLinkt, appUrl: appUrl, t })),
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
        const t = await getTranslations("Emails.invitationSignUp")
        const options: EmailOptions = {
            to: [email],
            subject: t("subject", { appName: appName }),
            html: await render(InvitationSignUp({ name, inviteLink: inviteLink, appUrl: appUrl, t })),
        }
        return sendEmail(options)
    } catch (error) {
        console.error("Failed to send invitation email:", error)
        return false
    }
}
