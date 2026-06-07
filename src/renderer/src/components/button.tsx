import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "transition-smooth inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-cyan-300 to-violet-300 text-slate-950 shadow-glow hover:-translate-y-0.5 hover:brightness-105",
        secondary: "bg-secondary text-secondary-foreground hover:-translate-y-0.5 hover:bg-secondary/80",
        ghost: "text-muted-foreground hover:-translate-y-0.5 hover:bg-white/[0.08] hover:text-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:-translate-y-0.5 hover:bg-destructive/90"
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 px-3",
        icon: "h-10 w-10 px-0"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  )
);

Button.displayName = "Button";
