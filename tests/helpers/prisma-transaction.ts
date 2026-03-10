import { prismaTestRootClient, setPrismaClientForTesting } from "@/lib/prisma"

const ROLLBACK_SENTINEL = "__TEST_TRANSACTION_ROLLBACK__"

export async function withRollbackTransaction<T>(run: () => Promise<T>): Promise<T> {
    let result: T | undefined

    try {
        await prismaTestRootClient.$transaction(async (tx) => {
            setPrismaClientForTesting(tx)
            try {
                result = await run()
            } finally {
                setPrismaClientForTesting(undefined)
            }
            throw new Error(ROLLBACK_SENTINEL)
        })
    } catch (error) {
        if (!(error instanceof Error) || error.message !== ROLLBACK_SENTINEL) {
            throw error
        }
    } finally {
        setPrismaClientForTesting(undefined)
    }

    if (result === undefined) {
        throw new Error("Transaction did not produce a result")
    }

    return result
}
