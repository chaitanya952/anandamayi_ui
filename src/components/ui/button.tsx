import * as React from "react"

import { cn } from "@/lib/utils"

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline"
  size?: "default" | "sm"
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default:
    "border border-amber-700 bg-amber-700 text-black hover:bg-amber-600 hover:border-amber-600",
  outline:
    "border border-amber-800/60 bg-transparent text-amber-200 hover:bg-amber-950/40 hover:border-amber-700",
}

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  default: "h-10 px-4 py-2 text-sm",
  sm: "h-8 px-3 text-xs",
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-sm font-medium tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 disabled:pointer-events-none disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    )
  }
)

Button.displayName = "Button"
