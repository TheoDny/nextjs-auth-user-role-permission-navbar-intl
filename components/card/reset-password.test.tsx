import { render, screen } from "@testing-library/react"
import userEvent, { UserEvent } from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import ResetPassword from "./reset-password"

const { resetPasswordMock, toastErrorMock, toastSuccessMock } = vi.hoisted(() => ({
    resetPasswordMock: vi.fn(),
    toastErrorMock: vi.fn(),
    toastSuccessMock: vi.fn(),
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
    authClient: {
        resetPassword: resetPasswordMock,
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
    })

    const clearAndType = async (user: UserEvent, password: string, confirmPassword: string) => {
        await user.clear(screen.getByPlaceholderText("passwordPlaceholder"))
        await user.clear(screen.getByPlaceholderText("confirmPasswordPlaceholder"))
        await user.type(screen.getByPlaceholderText("passwordPlaceholder"), password)
        await user.type(screen.getByPlaceholderText("confirmPasswordPlaceholder"), confirmPassword)
    }

    it("shows validation error for invalid password format", async () => {
        const user = userEvent.setup()
        render(<ResetPassword token="token-1" />)

        // passwordLength
        //too short
        const shortPassword = "short"
        await clearAndType(user, shortPassword, shortPassword)
        await user.click(screen.getByRole("button", { name: "changePassword" }))

        expect(await screen.findByText("passwordLength")).toBeInTheDocument()
        expect(resetPasswordMock).not.toHaveBeenCalled()
        expect(toastErrorMock).toHaveBeenCalledWith("passwordLength")
    
        //too long
        //clear clear and type a the same time
        const longPassword = "longlonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglonglong"
        await clearAndType(user, longPassword, longPassword)
        await user.click(screen.getByRole("button", { name: "changePassword" }))

        expect(await screen.findByText("passwordLength")).toBeInTheDocument()
        expect(resetPasswordMock).not.toHaveBeenCalled()
        expect(toastErrorMock).toHaveBeenCalledWith("passwordLength")

        // passwordUppercase
        const noUppercasePassword = "nouppercasenouppercase"
        await clearAndType(user, noUppercasePassword, noUppercasePassword)
        await user.click(screen.getByRole("button", { name: "changePassword" }))

        expect(await screen.findByText("passwordUppercase")).toBeInTheDocument()
        expect(resetPasswordMock).not.toHaveBeenCalled()
        expect(toastErrorMock).toHaveBeenCalledWith("passwordUppercase")

        // passwordNumber
        const noNumberPassword = "noNumbernoNumber"
        await clearAndType(user, noNumberPassword, noNumberPassword)
        await user.click(screen.getByRole("button", { name: "changePassword" }))

        expect(await screen.findByText("passwordNumber")).toBeInTheDocument()
        expect(resetPasswordMock).not.toHaveBeenCalled()
        expect(toastErrorMock).toHaveBeenCalledWith("passwordNumber")

        // passwordSpecialChar
        const specialCharPassword = "Test012345678900"
        await clearAndType(user, specialCharPassword, specialCharPassword)
        await user.click(screen.getByRole("button", { name: "changePassword" }))

        expect(await screen.findByText("passwordSpecialChar")).toBeInTheDocument()
        expect(resetPasswordMock).not.toHaveBeenCalled()
        expect(toastErrorMock).toHaveBeenCalledWith("passwordSpecialChar")

    })

    it("shows mismatch error and does not call resetPassword", async () => {
        const user = userEvent.setup()
        render(<ResetPassword token="token-1" />)

        const password = "Test012345678900!"
        const confirmPassword = "Different0123456789!"
        await clearAndType(user, password, confirmPassword)
        await user.click(screen.getByRole("button", { name: "changePassword" }))

        expect(await screen.findByText("passwordsDoNotMatch")).toBeInTheDocument()
        expect(resetPasswordMock).not.toHaveBeenCalled()
        expect(toastErrorMock).toHaveBeenCalledWith("passwordsDoNotMatch")
    })

    it("calls authClient.resetPassword with token and password", async () => {
        const user = userEvent.setup()
        resetPasswordMock.mockResolvedValue(undefined)
        render(<ResetPassword token="token-1" />)

        await clearAndType(user, "Test012345678900!", "Test012345678900!")
        await user.click(screen.getByRole("button", { name: "changePassword" }))

        expect(resetPasswordMock).toHaveBeenCalledTimes(1)
        expect(resetPasswordMock).toHaveBeenCalledWith(
            {
                token: "token-1",
                newPassword: "Test012345678900!",
            },
            expect.objectContaining({
                onSuccess: expect.any(Function),
                onError: expect.any(Function),
                onResponse: expect.any(Function),
                onRequest: expect.any(Function),
            })
        )
    })

    it("toggles password visibility with InputConceal", async () => {
        const user = userEvent.setup()
        render(<ResetPassword token="token-1" />)

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
