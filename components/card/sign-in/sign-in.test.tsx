import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { SignIn } from "./sign-in"

const { signInEmailMock, signInEmailOtpMock, sendOtpMock } = vi.hoisted(() => ({
    signInEmailMock: vi.fn(),
    signInEmailOtpMock: vi.fn(),
    sendOtpMock: vi.fn(),
}))

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
}))

vi.mock("next/link", () => ({
    default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
        <a
            href={href}
            {...props}
        >
            {children}
        </a>
    ),
}))

vi.mock("@/lib/auth-client", () => ({
    signIn: {
        email: signInEmailMock,
        emailOtp: signInEmailOtpMock,
    },
    authClient: {
        emailOtp: {
            sendVerificationOtp: sendOtpMock,
        },
    },
}))

describe("SignIn", () => {
    beforeEach(() => {
        signInEmailMock.mockReset()
        signInEmailOtpMock.mockReset()
        sendOtpMock.mockReset()
    })

    it("shows validation messages for invalid form values", async () => {
        const user = userEvent.setup()
        render(<SignIn />)

        await user.click(screen.getByRole("button", { name: "login" }))

        expect(await screen.findByText("Please enter a valid email")).toBeInTheDocument()
        expect(await screen.findByText("Password is required")).toBeInTheDocument()
        expect(signInEmailMock).not.toHaveBeenCalled()
    })

    it("submits credentials with signIn.email", async () => {
        const user = userEvent.setup()
        signInEmailMock.mockResolvedValue(undefined)
        render(<SignIn />)

        await user.type(screen.getByLabelText("email"), "test@test.com")
        await user.type(screen.getByLabelText("password"), "Test0123456789!")
        await user.click(screen.getByRole("button", { name: "login" }))

        expect(signInEmailMock).toHaveBeenCalledTimes(1)
        expect(signInEmailMock).toHaveBeenCalledWith(
            expect.objectContaining({
                email: "test@test.com",
                password: "Test0123456789!",
            }),
        )
    })

    it("toggles password visibility with InputConceal", async () => {
        const user = userEvent.setup()
        render(<SignIn />)

        const passwordInput = screen.getByLabelText("password")
        expect(passwordInput).toHaveAttribute("type", "password")

        await user.click(screen.getByRole("button", { name: "Show password" }))
        expect(passwordInput).toHaveAttribute("type", "text")

        await user.click(screen.getByRole("button", { name: "Hide password" }))
        expect(passwordInput).toHaveAttribute("type", "password")
    })

    it("sends OTP and signs in with emailOtp on code tab", async () => {
        const user = userEvent.setup()
        sendOtpMock.mockImplementation((_data: unknown, opts: Record<string, (() => void) | undefined>) => {
            opts.onRequest?.()
            opts.onSuccess?.()
            opts.onResponse?.()
            return Promise.resolve()
        })
        signInEmailOtpMock.mockImplementation((_data: unknown, opts: Record<string, (() => void) | undefined>) => {
            opts.onRequest?.()
            opts.onSuccess?.()
            opts.onResponse?.()
            return Promise.resolve()
        })
        render(<SignIn />)

        await user.click(screen.getByRole("button", { name: "tabEmailCode" }))
        await user.type(screen.getByLabelText("email"), "otp@test.com")
        await user.click(screen.getByRole("button", { name: "sendCode" }))

        expect(sendOtpMock).toHaveBeenCalledWith(
            { email: "otp@test.com", type: "sign-in" },
            expect.any(Object),
        )

        await user.type(screen.getByLabelText("otp"), "123456")
        await user.click(screen.getByRole("button", { name: "signInWithOtp" }))

        expect(signInEmailOtpMock).toHaveBeenCalledWith(
            expect.objectContaining({ email: "otp@test.com", otp: "123456" }),
            expect.any(Object),
        )
    })
})
