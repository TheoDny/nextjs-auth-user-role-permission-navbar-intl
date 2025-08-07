import { exec } from "child_process"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
    const headersList = await headers()
    if (headersList.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }
    //execute a commond line to reset database
    console.info("Resetting database")
    await exec("npx prisma migrate reset --force")

    return NextResponse.json({ ok: true })
}
