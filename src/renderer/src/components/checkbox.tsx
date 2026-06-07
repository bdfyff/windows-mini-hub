import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type CheckboxProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;

export function Checkbox({ className, checked, ...props }: CheckboxProps) {
  return (
    <span className="relative inline-grid h-5 w-5 place-items-center">
      <input
        type="checkbox"
        checked={checked}
        className={cn(
          "peer h-5 w-5 appearance-none rounded border border-white/[0.18] bg-white/5 transition checked:border-primary checked:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className
        )}
        {...props}
      />
      <Check className="pointer-events-none absolute h-3.5 w-3.5 text-primary-foreground opacity-0 transition peer-checked:opacity-100" />
    </span>
  );
}
