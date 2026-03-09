import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { SignIn } from "./sign-in"

const { signInEmailMock } = vi.hoisted(() => ({
    signInEmailMock: vi.fn(),
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
    },
}))

describe("SignIn", () => {
    beforeEach(() => {
        signInEmailMock.mockReset()
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
            })
        )
    })
})
