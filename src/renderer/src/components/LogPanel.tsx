import { Terminal } from "lucide-react";
import { useEffect, useRef } from "react";
import type { HubLogEvent } from "../../../shared";
import { Badge } from "./badge";
import { Card, CardContent, CardHeader, CardTitle } from "./card";

const levelTone = {
  info: "default",
  success: "success",
  warning: "warning",
  error: "error"
} as const;

export function LogPanel({
  className = "",
  logs,
  showLegend = true,
  terminalClassName = "h-[320px]"
}: {
  className?: string;
  logs: HubLogEvent[];
  showLegend?: boolean;
  terminalClassName?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [logs]);

  return (
    <Card className={`min-h-0 ${className}`}>
      <CardHeader className="flex shrink-0 flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-primary" />
          Live log
        </CardTitle>
        <Badge tone="muted">{logs.length} events</Badge>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col">
        <div
          ref={scrollRef}
          className={`${terminalClassName} overflow-auto rounded-md border border-white/10 bg-[#020617]/80 p-3 font-mono text-xs leading-5 shadow-inner shadow-black/40`}
        >
          {logs.length === 0 ? (
            <div className="text-muted-foreground">No activity yet.</div>
          ) : (
            logs.map((log, index) => (
              <div key={`${log.timestamp}-${index}`} className="grid grid-cols-[86px_84px_1fr] gap-3 py-1">
                <span className="text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString()}</span>
                <span className="text-muted-foreground">{log.source}</span>
                <span
                  className={
                    log.level === "error"
                      ? "text-red-200"
                      : log.level === "success"
                        ? "text-emerald-200"
                        : log.level === "warning"
                          ? "text-amber-200"
                          : "text-slate-200"
                  }
                >
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
        {showLegend && (
          <div className="mt-3 flex shrink-0 gap-2">
            <Badge tone="default">info</Badge>
            <Badge tone={levelTone.success}>success</Badge>
            <Badge tone={levelTone.warning}>warning</Badge>
            <Badge tone={levelTone.error}>error</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
