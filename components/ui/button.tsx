import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-xl border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-violet-400 focus-visible:ring-3 focus-visible:ring-violet-500/30 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-red-400 aria-invalid:ring-3 aria-invalid:ring-red-500/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-900/25 hover:brightness-110",
        outline: "border-slate-700 bg-slate-900/80 text-slate-100 hover:border-violet-500/40 hover:bg-slate-800",
        secondary: "bg-slate-800 text-slate-100 hover:bg-slate-700",
        ghost: "text-slate-300 hover:bg-slate-800 hover:text-white",
        destructive: "bg-red-500/10 text-red-200 hover:bg-red-500/20 focus-visible:border-red-400 focus-visible:ring-red-500/20",
        link: "text-violet-300 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 gap-1.5 px-4",
        xs: "h-7 gap-1 rounded-md px-2 text-xs",
        sm: "h-8 gap-1 rounded-lg px-3 text-sm",
        lg: "h-11 gap-2 px-5 text-base",
        icon: "size-10",
        "icon-xs": "size-7 rounded-md",
        "icon-sm": "size-8 rounded-lg",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
