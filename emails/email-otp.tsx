import { Body, Container, Head, Heading, Html, Link, Preview, Text } from "@react-email/components"
import type { TranslationValues } from "next-intl"

export type EmailOtpPurpose = "sign-in" | "forget-password" | "email-verification" | "change-email"

interface EmailOtpProps {
    otp: string
    appUrl: string
    purpose: EmailOtpPurpose
    expiresMinutes: number
    t?: (key: string, values?: TranslationValues) => string
}

const appName = process.env.NEXT_PUBLIC_NAME_APP ?? "NEXT_PUBLIC_NAME_APP"

const defaultTranslations: Record<string, string> = {
    preview: "Votre code de vérification",
    headingSignIn: "Connexion par code",
    headingReset: "Réinitialisation du mot de passe",
    headingVerify: "Vérification de l’email",
    headingChangeEmail: "Changement d’adresse email",
    introSignIn: "Utilisez le code ci-dessous pour vous connecter.",
    introReset: "Utilisez le code ci-dessous pour réinitialiser votre mot de passe.",
    introVerify: "Utilisez le code ci-dessous pour vérifier votre adresse email.",
    introChangeEmail: "Utilisez le code ci-dessous pour confirmer le changement d’email.",
    codeLabel: "Votre code",
    expires: "Ce code expire dans {minutes} minutes.",
    ignoreIfNotYou: "Si vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail.",
    backToApp: "Retour sur",
}

const EmailOtp = ({ otp, appUrl, purpose, expiresMinutes, t }: EmailOtpProps) => {
    const translate = (key: string, values?: TranslationValues) => t?.(key, values) ?? defaultTranslations[key] ?? key
    const headingKey =
        purpose === "sign-in"
            ? "headingSignIn"
            : purpose === "forget-password"
              ? "headingReset"
              : purpose === "change-email"
                ? "headingChangeEmail"
                : "headingVerify"
    const introKey =
        purpose === "sign-in"
            ? "introSignIn"
            : purpose === "forget-password"
              ? "introReset"
              : purpose === "change-email"
                ? "introChangeEmail"
                : "introVerify"
    return (
        <Html>
            <Head />
            <Preview>{translate("preview")}</Preview>
            <Body style={styles.body}>
                <Container style={styles.container}>
                    <Heading style={styles.heading}>{translate(headingKey)}</Heading>
                    <Text style={styles.text}>{translate(introKey)}</Text>
                    <Text style={styles.code}>{otp}</Text>
                    <Text style={styles.textMuted}>{translate("codeLabel")}</Text>
                    <Text style={styles.text}>{translate("expires", { minutes: String(expiresMinutes) })}</Text>
                    <Text style={styles.text}>{translate("ignoreIfNotYou")}</Text>
                    <Text style={styles.text}>
                        {translate("backToApp")}{" "}
                        <Link
                            href={appUrl}
                            style={styles.link}
                        >
                            {appName}
                        </Link>
                    </Text>
                </Container>
            </Body>
        </Html>
    )
}

EmailOtp.PreviewProps = {
    appUrl: "http://localhost:3000",
    otp: "123456",
    purpose: "sign-in" as const,
    expiresMinutes: 5,
} satisfies EmailOtpProps

const styles = {
    body: { backgroundColor: "#f8fafc", padding: "20px", fontFamily: "Inter, sans-serif" },
    container: {
        backgroundColor: "#ffffff",
        padding: "24px",
        borderRadius: "8px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    },
    heading: { color: "#1e293b", fontSize: "20px", fontWeight: "600", marginBottom: "16px" },
    text: { color: "#475569", fontSize: "14px", marginBottom: "12px", lineHeight: "1.6" },
    textMuted: { color: "#64748b", fontSize: "12px", marginBottom: "8px" },
    code: {
        color: "#0f172a",
        fontSize: "28px",
        fontWeight: "700",
        letterSpacing: "0.2em",
        marginBottom: "16px",
        fontFamily: "ui-monospace, monospace",
    },
    link: { color: "#6366f1", textDecoration: "none", fontWeight: "500" },
}

export default EmailOtp
