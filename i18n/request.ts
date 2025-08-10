import { getRequestConfig } from "next-intl/server"
import { cookies, headers } from "next/headers"

export const IMPLEMENTED_LOCALE = ["en", "fr"]

export default getRequestConfig(async () => {
    let locale =
        (await cookies()).get("NEXT_LOCALE")?.value || (navigator.language.split("-")[0] === "fr" ? "fr" : "en")

    if (!IMPLEMENTED_LOCALE.includes(locale)) {
        const h = (await headers()).get("accept-language")
        let l
        if (h && h.length > 2) {
            l = h[0] + h[1]
        }

        locale = l || "en"
    }

    return {
        locale,
        messages: (await import(`./messages/${locale}.json`)).default,
    }
})
