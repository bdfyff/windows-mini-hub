import { ArrowRight, CheckCircle2, Download, FolderOpen, Package, RefreshCw, Settings2, ShieldAlert, Sparkles, Wand2 } from "lucide-react";
import type { AppQueueItem, AppStatusMap, HubStatus, SystemCheck } from "../../../shared";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/card";
import { apps } from "@/data/apps";
import { presets } from "@/data/presets";

type DashboardPageProps = {
  appStatuses: AppStatusMap;
  downloadsFolder: string;
  lastRunAt: string;
  isScanningApps: boolean;
  onScanApps: () => Promise<void>;
  onUpdateInstalled: () => void;
  queue: AppQueueItem[];
  selected: string[];
  setPage: (page: "dashboard" | "apps" | "tweaks" | "logs" | "sources" | "settings") => void;
  setSelected: (ids: string[]) => void;
  status: HubStatus;
  systemChecks: SystemCheck[];
};

export function DashboardPage({
  appStatuses,
  downloadsFolder,
  isScanningApps,
  lastRunAt,
  onScanApps,
  onUpdateInstalled,
  queue,
  selected,
  setPage,
  setSelected,
  status,
  systemChecks
}: DashboardPageProps) {
  const recommended = presets.find((preset) => preset.id === "fresh-base") ?? presets[0];
  const manualCount = apps.filter((app) => app.installType === "manual" || app.sourceRequired).length;
  const installedCount = Object.values(appStatuses).filter((item) => item === "installed").length;
  const installedApps = apps.filter((app) => appStatuses[app.id] === "installed");
  const successCount = queue.filter((item) => item.status === "success").length;
  const checksOk = systemChecks.filter((check) => check.status === "ok").length;
  const lastRunLabel = lastRunAt ? new Date(lastRunAt).toLocaleString() : "No runs yet";

  const installRecommended = async () => {
    const installable = recommended.appIds.filter((id) => {
      const app = apps.find((item) => item.id === id);
      return app && app.installType !== "manual" && !app.sourceRequired;
    });
    setSelected(installable);
    await window.miniHub.installApps(installable);
  };

  const stats = [
    { label: "Total apps", value: apps.length, icon: Package },
    { label: "Selected apps", value: selected.length, icon: Sparkles },
    { label: "Installed/success", value: installedCount + successCount, icon: CheckCircle2 },
    { label: "Manual/source required", value: manualCount, icon: ShieldAlert }
  ];

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-lg border border-white/10 bg-[linear-gradient(135deg,rgba(14,165,233,0.18),rgba(124,58,237,0.14),rgba(15,23,42,0.72))] p-7 shadow-2xl shadow-black/30 backdrop-blur-2xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />
        <div className="max-w-3xl">
          <Badge tone={status === "running" ? "warning" : "default"} className="mb-4">
            {status === "running" ? "setup running" : "fresh setup dashboard"}
          </Badge>
          <h1 className="text-4xl font-semibold tracking-normal text-white">Set up your fresh Windows in minutes</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
            Install apps, download trusted setup files, apply safe tweaks, and monitor everything from one polished desktop hub.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={installRecommended} disabled={status === "running"}>
              <Download className="h-4 w-4" />
              Install recommended
            </Button>
            <Button variant="secondary" onClick={() => void onScanApps()} disabled={isScanningApps || status === "running"}>
              <RefreshCw className={isScanningApps ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              Scan installed apps
            </Button>
            <Button variant="secondary" onClick={onUpdateInstalled} disabled={status === "running" || installedCount === 0}>
              <RefreshCw className="h-4 w-4" />
              Update installed
            </Button>
            <Button variant="secondary" onClick={() => setPage("apps")}>
              Open Apps
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="secondary" onClick={() => setPage("tweaks")}>
              Open Tweaks
              <Settings2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="bg-white/[0.045]">
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{stat.label}</div>
                  <div className="mt-2 text-3xl font-semibold">{stat.value}</div>
                </div>
                <div className="grid h-11 w-11 place-items-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-4 w-4 text-primary" />
            Recommended setup
          </CardTitle>
          <CardDescription>{recommended.description}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {recommended.appIds.map((id) => {
            const app = apps.find((item) => item.id === id);
            if (!app) return null;
            return (
              <div key={id} className="rounded-md border border-white/10 bg-white/[0.035] p-3">
                <div className="font-medium">{app.name}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge tone="muted">{app.category}</Badge>
                  <Badge tone={app.installType === "winget" ? "success" : "default"}>{app.installType}</Badge>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {installedApps.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Installed apps detected
              </CardTitle>
              <CardDescription>Apps found on this Windows install after the last scan.</CardDescription>
            </div>
            <Button variant="secondary" onClick={() => setPage("apps")}>
              View all
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {installedApps.slice(0, 16).map((app) => (
              <Badge key={app.id} tone="success">
                {app.name}
              </Badge>
            ))}
            {installedApps.length > 16 && <Badge tone="muted">+{installedApps.length - 16} more</Badge>}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Fresh Windows checklist
            </CardTitle>
            <CardDescription>Compact overview of setup readiness and progress.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {[
              { label: "Apps selected", value: `${selected.length} selected`, ok: selected.length > 0 },
              { label: "Installed apps scan", value: `${installedCount} detected`, ok: installedCount > 0 },
              { label: "System checks", value: `${checksOk}/${systemChecks.length || 4} ok`, ok: systemChecks.length > 0 && checksOk >= Math.min(3, systemChecks.length) },
              { label: "Downloads folder", value: downloadsFolder || "Resolving...", ok: Boolean(downloadsFolder) },
              { label: "Last run", value: lastRunLabel, ok: Boolean(lastRunAt) }
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium">{item.label}</div>
                  <Badge tone={item.ok ? "success" : "muted"}>{item.ok ? "ready" : "pending"}</Badge>
                </div>
                <div className="mt-2 truncate text-sm text-muted-foreground">{item.value}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-primary" />
              Downloads
            </CardTitle>
            <CardDescription>Installers and archives saved by direct/GitHub sources.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="truncate rounded-md border border-white/10 bg-black/[0.22] p-3 text-sm text-muted-foreground">
              {downloadsFolder || "Downloads / Windows Mini Hub"}
            </div>
            <Button className="w-full" variant="secondary" onClick={() => void window.miniHub.openDownloadsFolder()}>
              <FolderOpen className="h-4 w-4" />
              Open downloads folder
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
