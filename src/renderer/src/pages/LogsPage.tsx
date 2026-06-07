import { Activity, Copy, RotateCcw } from "lucide-react";
import type { AppQueueItem, HubLogEvent, HubStatus } from "../../../shared";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/card";
import { LogPanel } from "@/components/LogPanel";
import { StatusPill } from "@/components/StatusPill";

type LogsPageProps = {
  logs: HubLogEvent[];
  queue: AppQueueItem[];
  status: HubStatus;
  onClear: () => void;
};

export function LogsPage({ logs, queue, status, onClear }: LogsPageProps) {
  const runningTask = queue.find((item) => item.status === "running");
  const errorCount = logs.filter((log) => log.level === "error").length;

  const copyLogs = async () => {
    const text = logs
      .map((log) => `[${new Date(log.timestamp).toLocaleTimeString()}] ${log.level.toUpperCase()} ${log.source}: ${log.message}`)
      .join("\n");
    await navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Logs</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Terminal-style live output for installers, downloads, tweaks, and system checks.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={copyLogs} disabled={logs.length === 0}>
            <Copy className="h-4 w-4" />
            Copy logs
          </Button>
          <Button variant="secondary" onClick={onClear}>
            <RotateCcw className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>

      <div className="grid shrink-0 gap-4 md:grid-cols-3">
        <Card className="min-h-0">
          <CardHeader className="p-4 pb-2">
            <CardTitle>Status</CardTitle>
            <CardDescription>Current runner state</CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <StatusPill status={status} />
          </CardContent>
        </Card>
        <Card className="min-h-0">
          <CardHeader className="p-4 pb-2">
            <CardTitle>Running task</CardTitle>
            <CardDescription>Active queue item</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center gap-2 p-4 pt-1">
            <Activity className="h-4 w-4 text-primary" />
            <span className="min-w-0 truncate text-sm text-muted-foreground">{runningTask?.name ?? "none"}</span>
          </CardContent>
        </Card>
        <Card className="min-h-0">
          <CardHeader className="p-4 pb-2">
            <CardTitle>Events</CardTitle>
            <CardDescription>Errors and total lines</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2 p-4 pt-1">
            <Badge tone="default">{logs.length} events</Badge>
            <Badge tone={errorCount > 0 ? "error" : "muted"}>{errorCount} errors</Badge>
          </CardContent>
        </Card>
      </div>

      <LogPanel className="flex min-h-0 flex-1 flex-col" logs={logs} showLegend={false} terminalClassName="min-h-0 flex-1" />
    </div>
  );
}
