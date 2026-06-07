import { useEffect, useMemo, useState } from "react";
import { Boxes, FileText, LayoutDashboard, Link2, Maximize2, Minus, ShieldCheck, ShieldAlert, Settings2, SlidersHorizontal, X } from "lucide-react";
import type { AppInfo, AppQueueItem, AppStatusMap, HubDownloadProgress, HubLogEvent, HubStatus, SystemCheck } from "../../shared";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { LogDock } from "@/components/LogDock";
import { Onboarding } from "@/components/Onboarding";
import { StatusPill } from "@/components/StatusPill";
import appIcon from "@/assets/icon.png";
import { apps } from "@/data/apps";
import { DashboardPage } from "@/pages/DashboardPage";
import { AppsPage } from "@/pages/AppsPage";
import { LogsPage } from "@/pages/LogsPage";
import { ManualPage } from "@/pages/ManualPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { TweaksPage } from "@/pages/TweaksPage";
import { cn } from "@/lib/utils";

type Page = "dashboard" | "apps" | "tweaks" | "logs" | "sources" | "settings";
type ThemeMode = "dark" | "light" | "system";

const navigation = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "apps", label: "Apps", icon: Boxes },
  { id: "tweaks", label: "Tweaks", icon: Settings2 },
  { id: "logs", label: "Logs", icon: FileText },
  { id: "sources", label: "Sources", icon: Link2 },
  { id: "settings", label: "Settings", icon: SlidersHorizontal }
] satisfies Array<{ id: Page; label: string; icon: typeof Boxes }>;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [defaultPage, setDefaultPage] = useState<Page>(() => (localStorage.getItem("miniHub:defaultPage") as Page) ?? "dashboard");
  const [page, setPage] = useState<Page>(() => (localStorage.getItem("miniHub:lastPage") as Page) ?? defaultPage);
  const [logs, setLogs] = useState<HubLogEvent[]>(() => readJson<HubLogEvent[]>("miniHub:lastLogs", []));
  const [status, setStatus] = useState<HubStatus>("idle");
  const [selectedApps, setSelectedApps] = useState<string[]>(() => readJson<string[]>("miniHub:selectedApps", []));
  const [appStatuses, setAppStatuses] = useState<AppStatusMap>(() => readJson<AppStatusMap>("miniHub:appStatuses", {}));
  const [queue, setQueue] = useState<AppQueueItem[]>([]);
  const [systemChecks, setSystemChecks] = useState<SystemCheck[]>(() => readJson<SystemCheck[]>("miniHub:systemChecks", []));
  const [downloadsFolder, setDownloadsFolder] = useState(() => localStorage.getItem("miniHub:downloadsFolder") ?? "");
  const [lastRunAt, setLastRunAt] = useState(() => localStorage.getItem("miniHub:lastRunAt") ?? "");
  const [showOnboarding, setShowOnboarding] = useState(() => localStorage.getItem("miniHub:onboardingComplete") !== "true");
  const [isAdmin, setIsAdmin] = useState(false);
  const [appInfo, setAppInfo] = useState<AppInfo>(() => ({ name: "Windows Mini Hub", version: "0.1.0", buildDate: "" }));
  const [downloadProgress, setDownloadProgress] = useState<Record<string, HubDownloadProgress>>({});
  const [isScanningApps, setIsScanningApps] = useState(false);
  const [summaryDismissedAt, setSummaryDismissedAt] = useState("");
  const [theme, setTheme] = useState<ThemeMode>(() => (localStorage.getItem("miniHub:theme") as ThemeMode) ?? "dark");
  const [compactMode, setCompactMode] = useState(() => localStorage.getItem("miniHub:compact") !== "false");
  const [animations, setAnimations] = useState(() => localStorage.getItem("miniHub:animations") !== "false");
  const [skipInstalled, setSkipInstalled] = useState(() => localStorage.getItem("miniHub:skipInstalled") !== "false");
  const [proMode, setProMode] = useState(() => localStorage.getItem("miniHub:proMode") === "true");

  useEffect(() => {
    void window.miniHub.getStatus().then(setStatus);
    const unsubscribeLog = window.miniHub.onLog((event) => setLogs((current) => [...current, event].slice(-250)));
    const unsubscribeStatus = window.miniHub.onStatus(setStatus);
    const unsubscribeQueue = window.miniHub.onQueue(setQueue);
    const unsubscribeProgress = window.miniHub.onDownloadProgress((progress) =>
      setDownloadProgress((current) => ({ ...current, [progress.appId]: progress }))
    );
    void window.miniHub.getAppInfo().then(setAppInfo);
    void window.miniHub.runSystemChecks().then(setSystemChecks);
    void window.miniHub.isAdmin().then(setIsAdmin);
    void window.miniHub.getDownloadsFolder().then((folder) => {
      setDownloadsFolder(folder);
      localStorage.setItem("miniHub:downloadsFolder", folder);
    });

    return () => {
      unsubscribeLog();
      unsubscribeStatus();
      unsubscribeQueue();
      unsubscribeProgress();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("miniHub:lastPage", page);
  }, [page]);

  useEffect(() => {
    localStorage.setItem("miniHub:lastLogs", JSON.stringify(logs.slice(-80)));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem("miniHub:selectedApps", JSON.stringify(selectedApps));
  }, [selectedApps]);

  useEffect(() => {
    localStorage.setItem("miniHub:appStatuses", JSON.stringify(appStatuses));
  }, [appStatuses]);

  useEffect(() => {
    localStorage.setItem("miniHub:systemChecks", JSON.stringify(systemChecks));
  }, [systemChecks]);

  useEffect(() => {
    if (queue.length === 0) return;
    const failed = queue.filter((item) => item.status === "error").map((item) => item.id);
    const completed = queue.filter((item) => item.status === "success").map((item) => item.id);
    if (failed.length > 0 || completed.length > 0) {
      setAppStatuses((current) => {
        const next = { ...current };
        completed.forEach((id) => {
          const app = apps.find((item) => item.id === id);
          next[id] = app?.installType === "direct" || app?.installType === "github" ? "download_ready" : "installed";
        });
        failed.forEach((id) => {
          next[id] = "failed_last_time";
        });
        return next;
      });
      setLastRunAt(new Date().toISOString());
    }
  }, [queue]);

  useEffect(() => {
    if (lastRunAt) {
      localStorage.setItem("miniHub:lastRunAt", lastRunAt);
    }
  }, [lastRunAt]);

  useEffect(() => {
    localStorage.setItem("miniHub:theme", theme);
    const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    document.documentElement.classList.toggle("light", theme === "light" || (theme === "system" && prefersLight));
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("miniHub:compact", String(compactMode));
    document.documentElement.classList.toggle("compact", compactMode);
  }, [compactMode]);

  useEffect(() => {
    localStorage.setItem("miniHub:defaultPage", defaultPage);
  }, [defaultPage]);

  useEffect(() => {
    localStorage.setItem("miniHub:skipInstalled", String(skipInstalled));
  }, [skipInstalled]);

  useEffect(() => {
    localStorage.setItem("miniHub:animations", String(animations));
    document.documentElement.classList.toggle("no-motion", !animations);
  }, [animations]);

  useEffect(() => {
    localStorage.setItem("miniHub:proMode", String(proMode));
  }, [proMode]);

  const errorCount = logs.filter((log) => log.level === "error").length + queue.filter((item) => item.status === "error").length;
  const queueFinished =
    queue.length > 0 && queue.every((item) => ["success", "error", "skipped", "cancelled"].includes(item.status)) && status !== "running";
  const summaryKey = queueFinished ? queue.map((item) => `${item.id}:${item.status}`).join("|") : "";
  const scanInstalledApps = async () => {
    setIsScanningApps(true);
    try {
      const statuses = await window.miniHub.checkApps(apps.map((app) => app.id));
      setAppStatuses(statuses);
    } finally {
      setIsScanningApps(false);
    }
  };

  const activePage = useMemo(() => {
    if (page === "dashboard") {
      return (
        <DashboardPage
          appStatuses={appStatuses}
          queue={queue}
          selected={selectedApps}
          systemChecks={systemChecks}
          downloadsFolder={downloadsFolder}
          lastRunAt={lastRunAt}
          isScanningApps={isScanningApps}
          onScanApps={scanInstalledApps}
          onUpdateInstalled={() => {
            const ids = apps.filter((app) => appStatuses[app.id] === "installed" || appStatuses[app.id] === "update_available").map((app) => app.id);
            if (ids.length > 0) void window.miniHub.updateInstalledApps(ids);
          }}
          setPage={setPage}
          setSelected={setSelectedApps}
          status={status}
        />
      );
    }

    if (page === "apps") {
      return (
        <AppsPage
          appStatuses={appStatuses}
          compactMode={compactMode}
          isRunning={status === "running"}
          isScanningApps={isScanningApps}
          onScanApps={scanInstalledApps}
          downloadProgress={downloadProgress}
          queue={queue}
          selected={selectedApps}
          setAppStatuses={setAppStatuses}
          setSelected={setSelectedApps}
          skipInstalled={skipInstalled}
        />
      );
    }

    if (page === "tweaks") {
      return <TweaksPage isRunning={status === "running"} proMode={proMode} />;
    }

    if (page === "settings") {
      return (
        <SettingsPage
          isAdmin={isAdmin}
          appInfo={appInfo}
          animations={animations}
          compactMode={compactMode}
          refreshAdmin={() => void window.miniHub.isAdmin().then(setIsAdmin)}
          restartAsAdmin={() => void window.miniHub.restartAsAdmin()}
          appStatuses={appStatuses}
          logs={logs}
          selectedApps={selectedApps}
          setAnimations={setAnimations}
          setCompactMode={setCompactMode}
          setDefaultPage={setDefaultPage}
          setProMode={setProMode}
          setSkipInstalled={setSkipInstalled}
          setTheme={setTheme}
          defaultPage={defaultPage}
          proMode={proMode}
          skipInstalled={skipInstalled}
          theme={theme}
        />
      );
    }

    if (page === "sources") {
      return <ManualPage />;
    }

    return <LogsPage logs={logs} queue={queue} status={status} onClear={() => setLogs([])} />;
  }, [
    animations,
    appStatuses,
    compactMode,
    defaultPage,
    downloadsFolder,
    isAdmin,
    appInfo,
    downloadProgress,
    isScanningApps,
    lastRunAt,
    logs,
    page,
    proMode,
    queue,
    selectedApps,
    skipInstalled,
    status,
    systemChecks,
    theme
  ]);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="app-drag flex h-11 shrink-0 items-center justify-between border-b border-white/10 bg-[#07101a]/92 pl-4 shadow-lg shadow-black/20 backdrop-blur-xl">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
          <img alt="" className="h-6 w-6 rounded-md shadow-sm shadow-cyan-500/20" src={appIcon} />
          Windows Mini Hub
          <span className="hidden text-xs text-muted-foreground sm:inline">v{appInfo.version}</span>
          <span className="app-no-drag ml-2 hidden items-center gap-1 rounded-md border border-white/10 bg-white/[0.045] px-2 py-0.5 text-xs text-muted-foreground sm:inline-flex">
            {isAdmin ? <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" /> : <ShieldAlert className="h-3.5 w-3.5 text-amber-300" />}
            {isAdmin ? "admin" : "standard"}
          </span>
        </div>
        <div className="app-no-drag flex h-full">
          <button aria-label="Minimize" className="grid h-11 w-12 place-items-center text-slate-300 transition hover:bg-white/10 hover:text-white" onClick={() => void window.miniHub.minimizeWindow()}>
            <Minus className="h-4 w-4" />
          </button>
          <button aria-label="Maximize" className="grid h-11 w-12 place-items-center text-slate-300 transition hover:bg-white/10 hover:text-white" onClick={() => void window.miniHub.toggleMaximizeWindow()}>
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <button aria-label="Close" className="grid h-11 w-12 place-items-center text-slate-300 transition hover:bg-red-500 hover:text-white" onClick={() => void window.miniHub.closeWindow()}>
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className="sticky top-0 hidden h-full w-72 shrink-0 overflow-hidden border-r border-white/10 bg-black/[0.24] p-5 backdrop-blur-2xl md:flex md:flex-col">
          <div className="shrink-0">
            <div className="flex items-center gap-3">
              <img alt="" className="h-11 w-11 rounded-lg shadow-lg shadow-cyan-500/20" src={appIcon} />
              <div>
                <div className="text-base font-semibold">Windows Mini Hub</div>
                <div className="text-xs text-muted-foreground">Setup dashboard</div>
              </div>
            </div>
          </div>

          <nav className="mt-8 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = page === item.id;
              const badge =
                item.id === "apps" && selectedApps.length > 0
                  ? selectedApps.length
                  : item.id === "logs" && errorCount > 0
                    ? errorCount
                    : item.id === "dashboard" && status === "running"
                      ? "run"
                      : null;

              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={cn(
                    "h-11 w-full justify-start rounded-lg",
                    active && "border border-cyan-300/20 bg-cyan-300/10 text-cyan-50 shadow-lg shadow-cyan-950/10"
                  )}
                  onClick={() => setPage(item.id)}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {badge !== null && <Badge tone={item.id === "logs" ? "error" : "default"}>{badge}</Badge>}
                </Button>
              );
            })}
          </nav>

          <Card className="mt-auto shrink-0 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium">Setup engine</div>
                <div className="mt-1 text-xs text-muted-foreground">WinGet, Store, GitHub</div>
              </div>
              <StatusPill status={status} />
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className={cn(
                  "h-full rounded-full bg-gradient-to-r from-cyan-300 to-violet-400 transition-all",
                  status === "running" && "w-2/3 animate-pulse",
                  status === "success" && "w-full",
                  status === "error" && "w-full from-red-400 to-amber-300",
                  status === "idle" && "w-1/4 from-slate-500 to-slate-400"
                )}
              />
            </div>
          </Card>
        </aside>

        <main
          className={cn(
            "min-w-0 flex-1 p-4 md:p-6",
            page === "logs" ? "overflow-hidden pb-4 md:pb-6" : "overflow-y-auto pb-24 md:pb-24"
          )}
        >
          <div key={page} className={cn("animate-page-in mx-auto grid max-w-7xl gap-5", page === "logs" && "h-full")}>
            <div className="grid grid-cols-2 gap-2 md:hidden">
              {navigation.map((item) => (
                <Button key={item.id} variant={page === item.id ? "secondary" : "ghost"} onClick={() => setPage(item.id)}>
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              ))}
            </div>
            {activePage}
          </div>
        </main>
      </div>
      {queueFinished && summaryKey !== summaryDismissedAt && (
        <PostRunSummary
          queue={queue}
          onClose={() => setSummaryDismissedAt(summaryKey)}
          onOpenDownloads={() => void window.miniHub.openDownloadsFolder()}
          onRetry={() => {
            const failed = queue.filter((item) => item.status === "error" || item.status === "cancelled").map((item) => item.id);
            if (failed.length > 0) void window.miniHub.installApps(failed);
          }}
        />
      )}
      {page !== "logs" && <LogDock logs={logs} queue={queue} setPage={setPage} status={status} />}
      {showOnboarding && (
        <Onboarding
          onClose={() => {
            localStorage.setItem("miniHub:onboardingComplete", "true");
            setShowOnboarding(false);
          }}
          onOpenApps={() => setPage("apps")}
          onPreset={(ids) => setSelectedApps(ids.filter((id) => apps.some((app) => app.id === id && app.installType !== "manual" && !app.sourceRequired)))}
        />
      )}
    </div>
  );
}

function PostRunSummary({
  onClose,
  onOpenDownloads,
  onRetry,
  queue
}: {
  onClose: () => void;
  onOpenDownloads: () => void;
  onRetry: () => void;
  queue: AppQueueItem[];
}) {
  const installed = queue.filter((item) => item.status === "success" && item.detail?.toLowerCase().includes("installed")).length;
  const downloaded = queue.filter((item) => item.status === "success" && item.detail?.toLowerCase().includes("downloaded")).length;
  const skipped = queue.filter((item) => item.status === "skipped" || item.status === "cancelled").length;
  const failed = queue.filter((item) => item.status === "error").length;
  const report = [
    "Windows Mini Hub run summary",
    `Installed: ${installed}`,
    `Downloaded: ${downloaded}`,
    `Skipped: ${skipped}`,
    `Failed: ${failed}`,
    "",
    ...queue.map((item) => `${item.status.toUpperCase()} - ${item.name}${item.detail ? ` - ${item.detail}` : ""}`)
  ].join("\n");

  return (
    <div className="fixed bottom-4 left-4 z-40 w-[min(520px,calc(100vw-2rem))]">
      <Card className="border-cyan-300/20 bg-[#07101a]/94 p-4 shadow-2xl shadow-black/35">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Install summary</div>
            <div className="mt-1 text-xs text-muted-foreground">Last queue finished. Review the result or retry failed items.</div>
          </div>
          <button className="text-muted-foreground transition hover:text-foreground" onClick={onClose} type="button">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {[
            ["installed", installed, "success"],
            ["downloaded", downloaded, "default"],
            ["skipped", skipped, "muted"],
            ["failed", failed, "error"]
          ].map(([label, value, tone]) => (
            <div key={label} className="rounded-md border border-white/10 bg-white/[0.035] p-3">
              <div className="text-lg font-semibold">{value}</div>
              <Badge tone={tone as "default" | "success" | "muted" | "error"}>{label}</Badge>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" disabled={failed === 0} onClick={onRetry}>
            Retry failed
          </Button>
          <Button size="sm" variant="secondary" onClick={onOpenDownloads}>
            Open downloads
          </Button>
          <Button size="sm" variant="ghost" onClick={() => void navigator.clipboard.writeText(report)}>
            Copy report
          </Button>
        </div>
      </Card>
    </div>
  );
}
