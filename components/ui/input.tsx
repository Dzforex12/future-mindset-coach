import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cn } from "cn"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-white transition-all outline-none placeholder:text-slate-400 focus:border-violet-500 focus:ring-3 focus:ring-violet-500/20 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-slate-900 disabled:opacity-50 aria-invalid:border-red-400 aria-invalid:ring-red-500/20",
        className,
      )}
      {...props}
    />
  )
}

export { Input }
