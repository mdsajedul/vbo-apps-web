import * as React from "react"
import { cn } from "@/lib/utils"

export interface FormErrorProps extends React.HTMLAttributes<HTMLParagraphElement> {
  message?: string;
}

export function FormError({ message, className, ...props }: FormErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <p
      className={cn("text-[0.8rem] font-medium text-red-500", className)}
      {...props}
    >
      {message}
    </p>
  )
}
