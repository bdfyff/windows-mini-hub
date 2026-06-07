import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "default" | "success" | "warning" | "error" | "muted";
};

const toneClass = {
  default: "border-sky-400/30 bg-sky-400/10 text-sky-100",
  success: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
  warning: "border-amber-400/30 bg-amber-400/10 text-amber-100",
  error: "border-red-400/30 bg-red-400/10 text-red-100",
  muted: "border-white/10 bg-white/5 text-muted-foreground"
};

export function Badge({ className, tone = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        toneClass[tone],
        className
      )}
      {...props}
    />
  );
}
