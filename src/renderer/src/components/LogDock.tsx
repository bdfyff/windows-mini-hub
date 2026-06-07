import { ChevronUp, Terminal, X } from "lucide-react";
import { useState } from "react";
import type { AppQueueItem, HubLogEvent, HubStatus } from "../../../shared";
import { Badge } from "./badge";
import { Button } from "./button";
import { StatusPill } from "./StatusPill";
import { cn } from "@/lib/utils";

type LogDockProps = {
  logs: HubLogEvent[];
  queue: AppQueueItem[];
  setPage: (page: "dashboard" | "apps" | "tweaks" | "logs" | "sources" | "settings") => void;
  status: HubStatus;
};

export function LogDock({ logs, queue, setPage, status }: LogDockProps) {
  const [expanded, setExpanded] = useState(false);
  const latest = logs.at(-1);
  const runningTask = queue.find((item) => item.status === "running" || item.status === "paused");
  const errorCount = logs.filter((log) => log.level === "error").length;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-40 w-[min(460px,calc(100vw-2rem))]">
      <div className="animate-rise-in pointer-events-auto overflow-hidden rounded-lg border border-white/10 bg-[#07101a]/92 shadow-2xl shadow-black/35 backdrop-blur-2xl transition-smooth">
        <button
          className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/[0.045]"
          onClick={() => setExpanded((value) => !value)}
          type="button"
        >
          <div className="grid h-8 w-8 place-items-center rounded-md border border-cyan-300/20 bg-cyan-300/[0.10] text-cyan-200">
            <Terminal className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Activity</span>
              <StatusPill status={status} />
              {errorCount > 0 && <Badge tone="error">{errorCount} errors</Badge>}
            </div>
            <div className="mt-1 truncate text-xs text-muted-foreground">
              {runningTask ? `${runningTask.status}: ${runningTask.name}` : latest ? latest.message : "No activity yet."}
            </div>
          </div>
          <ChevronUp className={cn("h-4 w-4 text-muted-foreground transition", expanded && "rotate-180")} />
        </button>

        {expanded && (
          <div className="border-t border-white/10 p-3">
            <div className="max-h-48 overflow-auto rounded-md border border-white/10 bg-black/35 p-3 font-mono text-xs leading-5">
              {logs.length === 0 ? (
                <div className="text-muted-foreground">No activity yet.</div>
              ) : (
                logs.slice(-8).map((log, index) => (
                  <div key={`${log.timestamp}-${index}`} className="grid grid-cols-[70px_1fr] gap-2 py-0.5">
                    <span className="text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString()}</span>
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
            <div className="mt-3 flex justify-between gap-2">
              <Button size="sm" variant="secondary" onClick={() => setPage("logs")}>
                Open full logs
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setExpanded(false)}>
                <X className="h-4 w-4" />
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
