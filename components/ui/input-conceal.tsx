import * as React from "react"

import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { Input } from "./input"

function InputConceal({ ...props }: React.ComponentProps<"input">) {
    const [isVisible, setIsVisible] = useState(false)

    return (
        <div className="relative">
            <Input
                type={isVisible ? "text" : "password"}
                {...props}
            />
            <span
                className="absolute right-6 top-1/2 -translate-y-1/2 cursor-pointer bg-transparent hover:bg-transparent dark:hover:bg-transparent"
                onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    setIsVisible(!isVisible)
                }}
            >
                {isVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </span>
        </div>
    )
}

export { InputConceal }
