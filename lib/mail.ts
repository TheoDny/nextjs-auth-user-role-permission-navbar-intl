import nodemailer from "nodemailer"

export const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST ?? "smtp.ethereal.email",
    port: parseInt(process.env.MAIL_PORT ?? "587", 10),
    auth: {
        user: process.env.MAIL_EMAIL_USER,
        pass: process.env.MAIL_EMAIL_PASSWORD,
    },
    secure: process.env.MAIL_SECURE === "true",
})
