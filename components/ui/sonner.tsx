"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
    const { theme = "system" } = useTheme()

    return (
        <Sonner
            theme={theme as ToasterProps["theme"]}
            className="toaster group"
            style={
                {
                    "--normal-bg": "var(--popover)",
                    "--normal-text": "var(--popover-foreground)",
                    "--normal-border": "var(--border)",
                } as React.CSSProperties
            }
            toastOptions={{
                classNames: {
                    error: "bg-destructive/30!",
                    success: "bg-green-400/30!",
                    warning: "bg-warning/30!",
                    info: "bg-blue-400/30!",
                },
            }}
            {...props}
        />
    )
}

export { Toaster }
