import EmailOtp, { type EmailOtpPurpose } from "@/emails/email-otp"
import InvitationSignUp from "@/emails/invitation-sign-up"
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
    if (process.env.MAILER_ACTIVE === "true") {
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

/**
 * Sends a one-time password email (Better Auth emailOTP plugin).
 *
 * @param email - Recipient address
 * @param otp - Plain OTP shown in the email (not stored by this function)
 * @param type - Better Auth OTP kind (includes `change-email` when that feature is enabled)
 * @param expiresInSeconds - Must match `emailOTP.expiresIn` in auth config (default 300)
 */
export async function sendEmailOtp(
    email: string,
    otp: string,
    type: EmailOtpPurpose,
    expiresInSeconds: number = 300,
) {
    const t = await getTranslations("Emails.emailOtp")
    const minutes = Math.max(1, Math.ceil(expiresInSeconds / 60))
    const subjectKey =
        type === "sign-in"
            ? "subjectSignIn"
            : type === "forget-password"
              ? "subjectForgetPassword"
              : type === "change-email"
                ? "subjectChangeEmail"
                : "subjectEmailVerification"
    const options: EmailOptions = {
        to: [email],
        subject: t(subjectKey, { appName }),
        html: await render(
            EmailOtp({
                otp,
                appUrl,
                purpose: type,
                expiresMinutes: minutes,
                t,
            }),
        ),
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
