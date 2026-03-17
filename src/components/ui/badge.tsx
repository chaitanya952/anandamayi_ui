import * as React from "react"

import { cn } from "@/lib/utils"

type BadgeProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "outline"
}

const variantClasses: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "border-transparent bg-amber-700 text-amber-50",
  outline: "border border-current bg-transparent text-current",
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-sm px-2.5 py-0.5 text-xs font-semibold",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  )
}
