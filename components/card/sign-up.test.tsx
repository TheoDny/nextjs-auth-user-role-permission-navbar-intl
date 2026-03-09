import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { SignUp } from "./sign-up"

const { handleSafeActionResultMock, signUpActionMock } = vi.hoisted(() => ({
    signUpActionMock: vi.fn(),
    handleSafeActionResultMock: vi.fn(),
}))

vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
}))

vi.mock("@/actions/user.action", () => ({
    signUpAction: signUpActionMock,
}))

vi.mock("@/lib/utils.client", () => ({
    handleSafeActionResult: handleSafeActionResultMock,
}))

describe("SignUp", () => {
    beforeEach(() => {
        signUpActionMock.mockReset()
        handleSafeActionResultMock.mockReset()
    })

    it("shows validation messages and does not submit invalid form", async () => {
        const user = userEvent.setup()
        render(
            <SignUp
                token="invitation-token"
                name="Test"
                email="test@test.com"
            />
        )

        await user.click(screen.getByRole("button", { name: "createAccount" }))

        expect(await screen.findByText("passwordLength")).toBeInTheDocument()
        expect(await screen.findByText("Please confirm your password")).toBeInTheDocument()
        expect(signUpActionMock).not.toHaveBeenCalled()
    })

    it("shows passwords do not match error and does not submit invalid form", async () => {
        const user = userEvent.setup()
        render(
            <SignUp
                token="invitation-token"
                name="Test"
                email="test@test.com"
            />
        )

        await user.type(screen.getByLabelText("password"), "Test012345678900!")
        await user.type(screen.getByLabelText("confirmPassword"), "Test999999999999!")
        await user.click(screen.getByRole("button", { name: "createAccount" }))

        expect(await screen.findByText("Passwords do not match")).toBeInTheDocument()

        expect(signUpActionMock).not.toHaveBeenCalled()
    })

    it("Show password requirements errors and does not submit invalid form", async () => {
        const user = userEvent.setup()

        render(
            <SignUp
                token="invitation-token"
                name="Test"
                email="test@test.com"
            />
        )

        await user.type(screen.getByLabelText("password"), "aaaaaaaaaaaaaaaaaaaaa")
        await user.type(screen.getByLabelText("confirmPassword"), "aaaaaaaaaaaaaaaaaaa")
        await user.click(screen.getByRole("button", { name: "createAccount" }))

        expect(await screen.findByText("passwordUppercase")).toBeInTheDocument()
        expect(signUpActionMock).not.toHaveBeenCalled()

        await user.type(screen.getByLabelText("password"), "Aaaaaaaaaaaaaaaaaaaaa")
        await user.type(screen.getByLabelText("confirmPassword"), "Aaaaaaaaaaaaaaaaaaa")

        expect(await screen.findByText("passwordNumber")).toBeInTheDocument()
        expect(signUpActionMock).not.toHaveBeenCalled()

        await user.type(screen.getByLabelText("password"), "Aaaaaaaaaaaaaaaaaaaaa0")
        await user.type(screen.getByLabelText("confirmPassword"), "Aaaaaaaaaaaaaaaaaaa0")

        expect(await screen.findByText("passwordSpecialChar")).toBeInTheDocument()
        expect(signUpActionMock).not.toHaveBeenCalled()

        await user.type(screen.getByLabelText("password"), "Aaaaaaaaaaaaaaaaaaaaa0!")
        await user.type(screen.getByLabelText("confirmPassword"), "Aaaaaaaaaaaaaaaaaaa0!")


        expect(signUpActionMock).not.toHaveBeenCalled()
    })

    it("submits valid form and redirects to sign-in", async () => {
        
        
        handleSafeActionResultMock.mockResolvedValue({ ok: true , data: { id: "u_1" }})
        signUpActionMock.mockResolvedValue({result: {data: { id: "u_1" }}})
        const user = userEvent.setup()
        render(
            <SignUp
                token="invitation-token"
                name="Test"
                email="test@test.com"
            />
        )

        await user.type(screen.getByLabelText("password"), "Test012345678900!")
        await user.type(screen.getByLabelText("confirmPassword"), "Test012345678900!")
        await user.click(screen.getByRole("button", { name: "createAccount" }))

        expect(signUpActionMock).toHaveBeenCalledTimes(1)
        expect(signUpActionMock).toHaveBeenCalledWith({
            email: "test@test.com",
            password: "Test012345678900!",
            passwordConfirmation: "Test012345678900!",
            token: "invitation-token",
        })
        expect(handleSafeActionResultMock).toHaveBeenCalledTimes(1)
    })
})
