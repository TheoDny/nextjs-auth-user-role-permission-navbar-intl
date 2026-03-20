import { Body, Container, Head, Heading, Html, Link, Preview, Text } from "@react-email/components"
import type { TranslationValues } from "next-intl"

interface ResetPasswordProps {
    resetLink: string
    appUrl: string
    t?: (key: string, values?: TranslationValues) => string
}
const appName = process.env.NEXT_PUBLIC_NAME_APP ?? "NEXT_PUBLIC_NAME_APP"

const defaultTranslations: Record<string, string> = {
    preview: "Réinitialisation de votre mot de passe",
    heading: "Réinitialisation de mot de passe",
    requestReceived: "Nous avons reçu une demande de réinitialisation de votre mot de passe.",
    ctaDescription: "Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :",
    ctaButton: "Réinitialiser mon mot de passe",
    copyLink: "Ou copiez-collez ce lien dans votre navigateur :",
    ignoreIfNotYou: "Si vous n'avez pas fait cette demande, ignorez cet e-mail.",
    backToApp: "Retour sur",
}

const ResetPassword = ({ resetLink, appUrl, t }: ResetPasswordProps) => {
    const translate = (key: string, values?: TranslationValues) => t?.(key, values) ?? defaultTranslations[key] ?? key
    return (
        <Html>
        <Head />
        <Preview>{translate("preview")}</Preview>
        <Body style={styles.body}>
            <Container style={styles.container}>
                <Heading style={styles.heading}>{translate("heading")}</Heading>
                <Text style={styles.text}>{translate("requestReceived")}</Text>
                <Text style={styles.text}>{translate("ctaDescription")}</Text>
                <Link
                    href={resetLink}
                    style={styles.button}
                >
                    {translate("ctaButton")}
                </Link>
                <Text style={styles.text}>{translate("copyLink")}</Text>
                <Text style={styles.link}>{resetLink}</Text>
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

ResetPassword.PreviewProps = {
    appUrl: "http://localhost:3000",
    resetLink: "http://localhost:3000/reset-password?token=123456",
} as ResetPasswordProps

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
    button: {
        display: "inline-block",
        backgroundColor: "#6366f1",
        color: "#ffffff",
        padding: "12px 24px",
        borderRadius: "6px",
        textDecoration: "none",
        fontWeight: "500",
        fontSize: "14px",
        transition: "background-color 0.2s",
    },
    link: { color: "#6366f1", textDecoration: "none", fontWeight: "500" },
}

export default ResetPassword
