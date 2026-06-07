import { Activity, CheckCircle2, Circle, Loader2, XCircle } from "lucide-react";
import { Badge } from "./badge";

type HubStatus = "idle" | "running" | "success" | "error";

const config = {
  idle: { label: "idle", tone: "muted" as const, icon: Circle },
  running: { label: "running", tone: "warning" as const, icon: Loader2 },
  success: { label: "success", tone: "success" as const, icon: CheckCircle2 },
  error: { label: "error", tone: "error" as const, icon: XCircle }
};

export function StatusPill({ status }: { status: HubStatus }) {
  const item = config[status] ?? { label: status, tone: "default" as const, icon: Activity };
  const Icon = item.icon;

  return (
    <Badge tone={item.tone} className="gap-1.5">
      <Icon className={status === "running" ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
      {item.label}
    </Badge>
  );
}
