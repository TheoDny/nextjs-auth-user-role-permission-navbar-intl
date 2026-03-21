import { render, screen } from "@testing-library/react"
import userEvent, { UserEvent } from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import ResetPassword from "./reset-password"

const { resetPasswordMock, toastErrorMock, toastSuccessMock, routerPushMock } = vi.hoisted(() => ({
    resetPasswordMock: vi.fn(),
    toastErrorMock: vi.fn(),
    toastSuccessMock: vi.fn(),
    routerPushMock: vi.fn(),
}))

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
}))

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: routerPushMock }),
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
    authClient: {
        emailOtp: {
            resetPassword: resetPasswordMock,
        },
    },
}))

vi.mock("sonner", () => ({
    toast: {
        error: toastErrorMock,
        success: toastSuccessMock,
    },
}))

describe("ResetPassword", () => {
    beforeEach(() => {
        resetPasswordMock.mockReset()
        toastErrorMock.mockReset()
        toastSuccessMock.mockReset()
        routerPushMock.mockReset()
    })

    const fillEmailOtp = async (user: UserEvent, email: string, otp: string) => {
        await user.clear(screen.getByLabelText("email"))
        await user.clear(screen.getByLabelText("otp"))
        await user.type(screen.getByLabelText("email"), email)
        await user.type(screen.getByLabelText("otp"), otp)
    }

    const clearAndTypePasswords = async (user: UserEvent, password: string, confirmPassword: string) => {
        await user.clear(screen.getByPlaceholderText("passwordPlaceholder"))
        await user.clear(screen.getByPlaceholderText("confirmPasswordPlaceholder"))
        await user.type(screen.getByPlaceholderText("passwordPlaceholder"), password)
        await user.type(screen.getByPlaceholderText("confirmPasswordPlaceholder"), confirmPassword)
    }

    it("rejects password shorter than 16 characters", async () => {
        const user = userEvent.setup()
        render(<ResetPassword />)
        await fillEmailOtp(user, "user@test.com", "123456")
        await clearAndTypePasswords(user, "short", "short")
        await user.click(screen.getByRole("button", { name: "changePassword" }))
        expect(await screen.findByText("passwordLength")).toBeInTheDocument()
        expect(resetPasswordMock).not.toHaveBeenCalled()
        expect(toastErrorMock).toHaveBeenCalledWith("passwordLength")
    })

    it("rejects password longer than 128 characters", async () => {
        const user = userEvent.setup()
        render(<ResetPassword />)
        await fillEmailOtp(user, "user@test.com", "123456")
        const longPassword = "a".repeat(129)
        await clearAndTypePasswords(user, longPassword, longPassword)
        await user.click(screen.getByRole("button", { name: "changePassword" }))
        expect(await screen.findByText("passwordLength")).toBeInTheDocument()
        expect(resetPasswordMock).not.toHaveBeenCalled()
    })

    it("rejects password without uppercase letter", async () => {
        const user = userEvent.setup()
        render(<ResetPassword />)
        await fillEmailOtp(user, "user@test.com", "123456")
        await clearAndTypePasswords(user, "lowercaseonly!!1", "lowercaseonly!!1")
        await user.click(screen.getByRole("button", { name: "changePassword" }))
        expect(await screen.findByText("passwordUppercase")).toBeInTheDocument()
        expect(resetPasswordMock).not.toHaveBeenCalled()
    })

    it("rejects password without a number", async () => {
        const user = userEvent.setup()
        render(<ResetPassword />)
        await fillEmailOtp(user, "user@test.com", "123456")
        await clearAndTypePasswords(user, "NoNumberNoNumber!", "NoNumberNoNumber!")
        await user.click(screen.getByRole("button", { name: "changePassword" }))
        expect(await screen.findByText("passwordNumber")).toBeInTheDocument()
        expect(resetPasswordMock).not.toHaveBeenCalled()
    })

    it("rejects password without a special character", async () => {
        const user = userEvent.setup()
        render(<ResetPassword />)
        await fillEmailOtp(user, "user@test.com", "123456")
        await clearAndTypePasswords(user, "Test012345678900", "Test012345678900")
        await user.click(screen.getByRole("button", { name: "changePassword" }))
        expect(await screen.findByText("passwordSpecialChar")).toBeInTheDocument()
        expect(resetPasswordMock).not.toHaveBeenCalled()
    })

    it("shows mismatch error and does not call resetPassword", async () => {
        const user = userEvent.setup()
        render(<ResetPassword />)
        await fillEmailOtp(user, "user@test.com", "123456")

        const password = "Test012345678900!"
        const confirmPassword = "Different0123456789!"
        await clearAndTypePasswords(user, password, confirmPassword)
        await user.click(screen.getByRole("button", { name: "changePassword" }))

        expect(await screen.findByText("passwordsDoNotMatch")).toBeInTheDocument()
        expect(resetPasswordMock).not.toHaveBeenCalled()
        expect(toastErrorMock).toHaveBeenCalledWith("passwordsDoNotMatch")
    })

    it("calls emailOtp.resetPassword with email, otp and password", async () => {
        const user = userEvent.setup()
        resetPasswordMock.mockResolvedValue(undefined)
        render(<ResetPassword />)

        await fillEmailOtp(user, "user@test.com", "654321")
        await clearAndTypePasswords(user, "Test012345678900!", "Test012345678900!")
        await user.click(screen.getByRole("button", { name: "changePassword" }))

        expect(resetPasswordMock).toHaveBeenCalledTimes(1)
        expect(resetPasswordMock).toHaveBeenCalledWith(
            {
                email: "user@test.com",
                otp: "654321",
                password: "Test012345678900!",
            },
            expect.objectContaining({
                onSuccess: expect.any(Function),
                onError: expect.any(Function),
                onResponse: expect.any(Function),
                onRequest: expect.any(Function),
            }),
        )
    })

    it("toggles password visibility with InputConceal", async () => {
        const user = userEvent.setup()
        render(<ResetPassword />)

        const passwordInput = screen.getByLabelText("password")

        expect(passwordInput).toHaveAttribute("type", "password")

        const showButtons = screen.getAllByRole("button", { name: "Show password" })
        await user.click(showButtons[0])
        expect(passwordInput).toHaveAttribute("type", "text")

        const hideButtons = screen.getAllByRole("button", { name: "Hide password" })
        await user.click(hideButtons[0])
        expect(passwordInput).toHaveAttribute("type", "password")
    })
})
