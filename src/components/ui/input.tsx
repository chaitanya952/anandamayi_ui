import * as React from "react"

import { cn } from "@/lib/utils"

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-[#6B1A2A]/15 bg-[#fffdfa] px-3 py-2 text-sm font-medium text-[#111111] placeholder:text-black/40 shadow-[0_1px_2px_rgba(61,10,18,0.05)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B2535]/20 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    )
  }
)

Input.displayName = "Input"
