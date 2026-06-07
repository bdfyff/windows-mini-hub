import {
  Archive,
  Bot,
  Check,
  Download,
  ExternalLink,
  FileDown,
  FileUp,
  FolderOpen,
  Gamepad2,
  Globe2,
  Info,
  MessageCircle,
  MonitorDown,
  PackageCheck,
  Pause,
  Play,
  RefreshCw,
  Save,
  Search,
  SlidersHorizontal,
  Square,
  Wand2
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  AppDefinition,
  AppInstallState,
  AppProfile,
  AppQueueItem,
  AppStatusMap,
  GithubAsset,
  HubDownloadProgress,
  PreflightResult,
  SourceOverride,
  SourceVerification
} from "../../../shared";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/card";
import { Checkbox } from "@/components/checkbox";
import { apps } from "@/data/apps";
import { presets } from "@/data/presets";
import { cn } from "@/lib/utils";

type AppsPageProps = {
  appStatuses: AppStatusMap;
  compactMode: boolean;
  isRunning: boolean;
  isScanningApps: boolean;
  onScanApps: () => Promise<void>;
  downloadProgress: Record<string, HubDownloadProgress>;
  queue: AppQueueItem[];
  selected: string[];
  setAppStatuses: (statuses: AppStatusMap) => void;
  setSelected: (ids: string[]) => void;
  skipInstalled: boolean;
};

const statusTone: Record<AppInstallState, "default" | "success" | "warning" | "error" | "muted"> = {
  installed: "success",
  not_installed: "warning",
  update_available: "warning",
  source_required: "error",
  download_ready: "success",
  failed_last_time: "error",
  checking: "default",
  unknown: "muted"
};

const statusLabel: Record<AppInstallState, string> = {
  installed: "installed",
  not_installed: "not installed",
  update_available: "update available",
  source_required: "source required",
  download_ready: "download ready",
  failed_last_time: "failed last time",
  checking: "checking",
  unknown: "unknown"
};

const queueTone = {
  queued: "muted",
  running: "warning",
  paused: "warning",
  success: "success",
  error: "error",
  skipped: "muted",
  cancelled: "warning"
} as const;

const sourceOptions = ["all", "winget", "github", "direct", "store", "manual"] as const;
const statusOptions = ["all", "installed", "not_installed", "update_available", "download_ready", "failed_last_time", "source_required"] as const;

function AppIcon({ app }: { app: AppDefinition }) {
  const className = "h-5 w-5";
  const id = app.id.toLowerCase();
  const brand = getBrand(app);
  if (brand) {
    return (
      <span className={`grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br ${brand.gradient} text-[10px] font-black text-white shadow-sm`}>
        {brand.label}
      </span>
    );
  }
  if (id.includes("winrar") || id.includes("7zip")) return <Archive className={className} />;
  if (id.includes("steam") || id.includes("epicgames") || id.includes("osu")) return <Gamepad2 className={className} />;
  if (id.includes("discord") || id.includes("max") || id.includes("ayugram")) return <MessageCircle className={className} />;
  if (id.includes("chrome") || id.includes("firefox") || id.includes("browser")) return <Globe2 className={className} />;
  if (id.includes("driver") || id.includes("nvidia") || id.includes("ajazz") || id.includes("darkproject")) return <MonitorDown className={className} />;
  return <Bot className={className} />;
}

function getBrand(app: AppDefinition) {
  const id = app.id.toLowerCase();
  if (id.includes("chrome")) return { label: "CH", gradient: "from-red-400 via-yellow-300 to-emerald-400" };
  if (id.includes("firefox")) return { label: "FF", gradient: "from-orange-500 to-violet-500" };
  if (id.includes("discord")) return { label: "DC", gradient: "from-indigo-400 to-violet-500" };
  if (id.includes("steam")) return { label: "ST", gradient: "from-slate-700 to-sky-500" };
  if (id.includes("vscode")) return { label: "VS", gradient: "from-sky-500 to-blue-700" };
  if (id.includes("visualstudiocode")) return { label: "VS", gradient: "from-sky-500 to-blue-700" };
  if (id.includes("videolan")) return { label: "VLC", gradient: "from-orange-400 to-amber-600" };
  if (id.includes("git.git")) return { label: "GIT", gradient: "from-orange-500 to-red-500" };
  if (id.includes("nodejs")) return { label: "JS", gradient: "from-lime-500 to-emerald-700" };
  if (id.includes("python")) return { label: "PY", gradient: "from-blue-500 to-yellow-400" };
  if (id.includes("7zip")) return { label: "7Z", gradient: "from-emerald-500 to-slate-600" };
  return null;
}

function FilterChip({ active, children, title, onClick }: { active: boolean; children: ReactNode; title?: string; onClick: () => void }) {
  return (
    <button
      className={cn(
        "transition-smooth h-9 min-w-0 rounded-md border px-3 text-xs font-medium",
        active
          ? "animate-soft-pop border-cyan-300/35 bg-cyan-300/[0.12] text-cyan-50 shadow-sm shadow-cyan-950/20"
          : "border-white/10 bg-white/[0.035] text-muted-foreground hover:-translate-y-0.5 hover:border-white/[0.18] hover:bg-white/[0.065] hover:text-foreground"
      )}
      onClick={onClick}
      title={title}
      type="button"
    >
      <span className="block max-w-[9.5rem] truncate">{children}</span>
    </button>
  );
}

export function AppsPage({
  appStatuses,
  compactMode,
  isRunning,
  isScanningApps,
  onScanApps,
  downloadProgress,
  queue,
  selected,
  setAppStatuses,
  setSelected,
  skipInstalled
}: AppsPageProps) {
  const [category, setCategory] = useState("all");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [recommendedOnly, setRecommendedOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [source, setSource] = useState<(typeof sourceOptions)[number]>("all");
  const [statusFilter, setStatusFilter] = useState<(typeof statusOptions)[number]>("all");
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [profiles, setProfiles] = useState<AppProfile[]>(() => readProfiles());
  const [profileName, setProfileName] = useState("My setup");
  const [preflight, setPreflight] = useState<PreflightResult | null>(null);
  const [preflightLoading, setPreflightLoading] = useState(false);
  const [sourceVerification, setSourceVerification] = useState<SourceVerification[]>([]);
  const [githubAssets, setGithubAssets] = useState<Record<string, GithubAsset[]>>({});
  const [githubAssetNames, setGithubAssetNames] = useState<Record<string, string>>({});
  const [sourceOverrides, setSourceOverrides] = useState<Record<string, SourceOverride>>({});

  useEffect(() => {
    void window.miniHub.getSourceOverrides().then((items) => {
      setSourceOverrides(Object.fromEntries(items.map((item) => [item.appId, item])));
    });
  }, []);

  const categories = useMemo(() => ["all", ...Array.from(new Set(apps.map((app) => app.category)))], []);
  const queueById = useMemo(() => new Map(queue.map((item) => [item.id, item])), [queue]);
  const recommendedIds = useMemo(() => new Set(presets.find((preset) => preset.id === "fresh-base")?.appIds ?? []), []);
  const hasCustomSource = (app: AppDefinition) => Boolean(sourceOverrides[app.id]);
  const getEffectiveInstallType = (app: AppDefinition) => (hasCustomSource(app) && (app.installType === "manual" || app.sourceRequired) ? "direct" : app.installType);
  const isAppInstallable = (app: AppDefinition) => app.installType !== "manual" && !app.sourceRequired || hasCustomSource(app);
  const installableIds = apps.filter((app) => isAppInstallable(app)).map((app) => app.id);
  const selectedDefinitions = selected.map((id) => apps.find((app) => app.id === id)).filter((app): app is AppDefinition => Boolean(app));
  const installedApps = apps.filter((app) => appStatuses[app.id] === "installed");
  const detectedApps = apps.filter((app) => ["installed", "download_ready", "update_available"].includes(appStatuses[app.id] ?? ""));
  const updatableIds = apps
    .filter((app) => appStatuses[app.id] === "installed" || appStatuses[app.id] === "update_available")
    .map((app) => app.id);
  const missingGaming = (presets.find((preset) => preset.id === "gaming")?.appIds ?? [])
    .map((id) => apps.find((app) => app.id === id))
    .filter((app): app is AppDefinition => Boolean(app && appStatuses[app.id] !== "installed"));
  const recommendedMissing = (presets.find((preset) => preset.id === "fresh-base")?.appIds ?? [])
    .map((id) => apps.find((app) => app.id === id))
    .filter((app): app is AppDefinition => Boolean(app && appStatuses[app.id] !== "installed"));
  const runnableSelected = selectedDefinitions.filter((app) => {
    const installed = appStatuses[app.id] === "installed";
    return isAppInstallable(app) && !(skipInstalled && installed);
  });
  const skippedSelected = selectedDefinitions.length - runnableSelected.length;
  const summaryCounts = runnableSelected.reduce<Record<string, number>>((counts, app) => {
    const type = getEffectiveInstallType(app);
    counts[type] = (counts[type] ?? 0) + 1;
    return counts;
  }, {});

  const filteredApps = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return apps.filter((app) => {
      const matchesSearch =
        !normalized ||
        app.name.toLowerCase().includes(normalized) ||
        app.description.toLowerCase().includes(normalized) ||
        app.category.toLowerCase().includes(normalized);
      const matchesCategory = category === "all" || app.category === category;
      const matchesSource = source === "all" || app.installType === source;
      const state = appStatuses[app.id] ?? (app.sourceRequired && !hasCustomSource(app) ? "source_required" : "unknown");
      const matchesStatus = statusFilter === "all" || state === statusFilter;
      const matchesRecommended = !recommendedOnly || recommendedIds.has(app.id);
      return matchesSearch && matchesCategory && matchesSource && matchesStatus && matchesRecommended;
    });
  }, [appStatuses, category, recommendedIds, recommendedOnly, search, source, statusFilter, sourceOverrides]);

  const toggleApp = (id: string) => {
    setSelected(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);
  };

  const applyPreset = (ids: string[]) => {
    setSelected(ids.filter((id) => installableIds.includes(id)));
  };

  const importSelection = async () => {
    const ids = await window.miniHub.importSelection();
    if (ids.length > 0) setSelected(ids);
  };

  const prepareInstall = async () => {
    setSummaryOpen(true);
    setPreflight(null);
    setSourceVerification([]);
    setPreflightLoading(true);
    try {
      const ids = runnableSelected.map((app) => app.id);
      const [result, verification, assets] = await Promise.all([
        window.miniHub.runPreflight(ids),
        window.miniHub.verifySources(ids),
        window.miniHub.getGithubAssets(ids)
      ]);
      setPreflight(result);
      setSourceVerification(verification);
      setGithubAssets(assets);
      setGithubAssetNames(
        Object.fromEntries(Object.entries(assets).map(([appId, items]) => [appId, items[0]?.name ?? ""]).filter(([, name]) => Boolean(name)))
      );
      setAppStatuses({ ...appStatuses, ...result.appStatuses });
    } finally {
      setPreflightLoading(false);
    }
  };

  const startInstallWithAssets = async () => {
    setSummaryOpen(false);
    await window.miniHub.installApps(runnableSelected.map((app) => app.id), { githubAssetNames });
  };

  const retryFailed = async () => {
    const failedIds = queue.filter((item) => item.status === "error" || item.status === "cancelled").map((item) => item.id);
    if (failedIds.length > 0) await window.miniHub.installApps(failedIds);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Apps</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Search, filter, review preflight checks, and run a controlled installer queue.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => void onScanApps()} disabled={isRunning || isScanningApps}>
            <RefreshCw className={isScanningApps ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            Scan installed
          </Button>
          <Button variant="secondary" onClick={() => void window.miniHub.updateInstalledApps(updatableIds)} disabled={isRunning || updatableIds.length === 0}>
            <RefreshCw className="h-4 w-4" />
            Update installed
          </Button>
          <Button variant="secondary" onClick={importSelection} disabled={isRunning}>
            <FileUp className="h-4 w-4" />
            Import
          </Button>
          <Button variant="secondary" onClick={() => void window.miniHub.exportSelection(selected)} disabled={selected.length === 0}>
            <FileDown className="h-4 w-4" />
            Export
          </Button>
          {isRunning ? (
            <Button variant="destructive" onClick={() => void window.miniHub.cancelInstall()}>
              <Square className="h-4 w-4" />
              Cancel
            </Button>
          ) : (
            <Button disabled={runnableSelected.length === 0} onClick={prepareInstall}>
              <Download className="h-4 w-4" />
              Install selected
              <Badge tone="muted">{runnableSelected.length}</Badge>
            </Button>
          )}
        </div>
      </div>

      <Card className="bg-white/[0.045]">
        <CardContent className="space-y-3 p-4">
          <div className="grid gap-3 xl:grid-cols-[1fr_auto_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                className="h-11 w-full rounded-md border border-white/10 bg-black/[0.24] pl-9 pr-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-300/15"
                onChange={(event) => setSearch(event.currentTarget.value)}
                placeholder="Search apps, categories, descriptions"
                value={search}
              />
            </div>
            <div className="relative">
              <Button className="w-full justify-between xl:w-52" variant="secondary" onClick={() => setCategoryOpen((value) => !value)}>
                <SlidersHorizontal className="h-4 w-4" />
                <span className="min-w-0 truncate">{category === "all" ? "All categories" : category}</span>
              </Button>
              {categoryOpen && (
                <div className="animate-rise-in absolute right-0 top-12 z-30 grid w-72 gap-2 rounded-lg border border-white/10 bg-[#07101a]/95 p-3 shadow-2xl shadow-black/40 backdrop-blur-2xl">
                  {categories.map((item) => (
                    <button
                      key={item}
                      className={cn(
                        "transition-smooth rounded-md px-3 py-2 text-left text-sm hover:bg-white/[0.07]",
                        category === item && "bg-cyan-300/[0.12] text-cyan-50"
                      )}
                      onClick={() => {
                        setCategory(item);
                        setCategoryOpen(false);
                      }}
                      type="button"
                    >
                      {item === "all" ? "All categories" : item}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              className={cn(
                "transition-smooth inline-flex h-10 items-center justify-center gap-1.5 rounded-md border px-3 text-sm font-medium",
                recommendedOnly
                  ? "animate-soft-pop border-cyan-300/35 bg-cyan-300/[0.12] text-cyan-50"
                  : "border-white/10 bg-white/[0.035] text-muted-foreground hover:border-white/[0.18] hover:bg-white/[0.065] hover:text-foreground"
              )}
              onClick={() => setRecommendedOnly(!recommendedOnly)}
              type="button"
            >
              <Wand2 className="h-4 w-4" />
              Recommended
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {sourceOptions.map((item) => (
              <FilterChip key={item} active={source === item} onClick={() => setSource(item)}>
                {item === "all" ? "All sources" : item}
              </FilterChip>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((item) => (
              <FilterChip key={item} active={statusFilter === item} onClick={() => setStatusFilter(item)}>
                {item === "all" ? "All statuses" : statusLabel[item]}
              </FilterChip>
            ))}
          </div>
        </CardContent>
      </Card>

      {detectedApps.length > 0 && (
        <Card className="bg-white/[0.045]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Scan result</CardTitle>
              <CardDescription>
                {installedApps.length} installed, {detectedApps.length} detected total. Use the Installed filter to inspect the full list.
              </CardDescription>
            </div>
            <Button variant="secondary" onClick={() => setStatusFilter("installed")}>
              Show installed
            </Button>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {installedApps.slice(0, 18).map((app) => (
              <Badge key={app.id} tone="success">
                {app.name}
              </Badge>
            ))}
            {installedApps.length > 18 && <Badge tone="muted">+{installedApps.length - 18} more</Badge>}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 xl:grid-cols-5">
        {presets.map((preset) => (
          <button
            key={preset.id}
            className="animate-rise-in transition-smooth rounded-lg border border-white/10 bg-white/[0.035] p-3 text-left hover:-translate-y-1 hover:border-cyan-300/35 hover:bg-white/[0.065] hover:shadow-xl hover:shadow-cyan-950/20"
            onClick={() => applyPreset(preset.appIds)}
            type="button"
          >
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Wand2 className="h-4 w-4 text-cyan-200" />
              {preset.name}
            </div>
            <div className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{preset.description}</div>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profiles</CardTitle>
          <CardDescription>Save or load reusable setup selections.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <Button key={preset.id} size="sm" variant="secondary" onClick={() => applyPreset(preset.appIds)}>
                {preset.name}
              </Button>
            ))}
            {profiles.map((profile) => (
              <Button key={profile.id} size="sm" variant="ghost" onClick={() => setSelected(profile.appIds)}>
                {profile.name}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="h-9 min-w-0 flex-1 rounded-md border border-white/10 bg-black/[0.18] px-3 text-sm outline-none focus:border-cyan-300/40"
              value={profileName}
              onChange={(event) => setProfileName(event.currentTarget.value)}
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                const next = saveProfile(profileName, selected);
                setProfiles(next);
              }}
              disabled={selected.length === 0}
            >
              <Save className="h-4 w-4" />
              Save profile
            </Button>
            <Button size="sm" variant="ghost" onClick={() => void window.miniHub.exportSelection(selected)} disabled={selected.length === 0}>
              <FileDown className="h-4 w-4" />
              Export current
            </Button>
            <Button size="sm" variant="ghost" onClick={importSelection}>
              <FileUp className="h-4 w-4" />
              Import profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {detectedApps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Smart recommendations</CardTitle>
            <CardDescription>Based on the latest installed apps scan.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 lg:grid-cols-3">
            <RecommendationBlock title="Already installed" items={installedApps.slice(0, 8).map((app) => app.name)} tone="success" />
            <RecommendationBlock title="Good next installs" items={recommendedMissing.slice(0, 8).map((app) => app.name)} tone="default" />
            <RecommendationBlock title="Gaming missing" items={missingGaming.slice(0, 8).map((app) => app.name)} tone="warning" />
          </CardContent>
        </Card>
      )}

      {queue.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Install queue</CardTitle>
            <CardDescription>Pause between apps, retry failed items, or open downloaded installers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {isRunning && (
                <>
                  <Button size="sm" variant="secondary" onClick={() => void window.miniHub.pauseInstall()}>
                    <Pause className="h-4 w-4" />
                    Pause
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => void window.miniHub.resumeInstall()}>
                    <Play className="h-4 w-4" />
                    Resume
                  </Button>
                </>
              )}
              {queue.some((item) => item.status === "error" || item.status === "cancelled") && (
                <Button size="sm" variant="secondary" onClick={retryFailed}>
                  <RefreshCw className="h-4 w-4" />
                  Retry failed
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => void window.miniHub.openDownloadsFolder()}>
                <FolderOpen className="h-4 w-4" />
                Downloads
              </Button>
            </div>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {queue.map((item) => (
                <div key={item.id} className="rounded-md border border-white/10 bg-black/20 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate text-sm font-medium">{item.name}</span>
                    <Badge tone={queueTone[item.status]}>{item.status}</Badge>
                  </div>
                  {item.detail && <div className="mt-1 truncate text-xs text-muted-foreground">{item.detail}</div>}
                  {downloadProgress[item.id] && (
                    <div className="mt-2">
                      <div className="flex justify-between text-[11px] text-muted-foreground">
                        <span className="truncate">{downloadProgress[item.id].fileName}</span>
                        <span>{downloadProgress[item.id].percent ?? 0}%</span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                        <div className="h-full rounded-full bg-cyan-300" style={{ width: `${downloadProgress[item.id].percent ?? 5}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {filteredApps.length === 0 ? (
        <Card>
          <CardContent className="grid min-h-[220px] place-items-center p-8 text-center">
            <div>
              <PackageCheck className="mx-auto h-8 w-8 text-muted-foreground" />
              <div className="mt-3 font-medium">No apps match these filters</div>
              <div className="mt-1 text-sm text-muted-foreground">Clear search or switch category/source filters.</div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredApps.map((app) => {
            const checked = selected.includes(app.id);
            const isInstallable = isAppInstallable(app);
            const appStatus = appStatuses[app.id] ?? (app.sourceRequired && !hasCustomSource(app) ? "source_required" : "unknown");
            const queueItem = queueById.get(app.id);

            return (
              <Card
                key={app.id}
                className={cn(
                  "group overflow-hidden hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-white/[0.06]",
                  checked && "border-cyan-300/45 bg-cyan-300/[0.08] shadow-xl shadow-cyan-950/20"
                )}
              >
                <CardContent className={cn("p-4", compactMode && "p-3")}>
                  <div className="flex items-start gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-white/10 bg-gradient-to-br from-cyan-300/[0.16] to-violet-400/[0.12] text-cyan-100">
                      <AppIcon app={app} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate font-semibold">{app.name}</div>
                          <div className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">{app.description}</div>
                        </div>
                        <Checkbox checked={checked} disabled={!isInstallable} onChange={() => toggleApp(app.id)} />
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge tone="muted">{app.category}</Badge>
                        <Badge tone={getEffectiveInstallType(app) === "winget" ? "success" : getEffectiveInstallType(app) === "manual" ? "muted" : "default"}>
                          {hasCustomSource(app) ? "custom source" : app.installType}
                        </Badge>
                        <Badge tone={statusTone[appStatus]}>{statusLabel[appStatus]}</Badge>
                        {recommendedIds.has(app.id) && <Badge tone="default">recommended</Badge>}
                        {queueItem && <Badge tone={queueTone[queueItem.status]}>{queueItem.status}</Badge>}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button size="sm" variant={checked ? "default" : "secondary"} disabled={!isInstallable} onClick={() => toggleApp(app.id)}>
                          {checked ? <Check className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                          {checked ? "Selected" : "Select"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setDetailsId(app.id)}>
                          <Info className="h-4 w-4" />
                          Details
                        </Button>
                        {app.sourceUrl && (
                          <Button size="sm" variant="ghost" onClick={() => void window.miniHub.openSource(app.id)}>
                            <ExternalLink className="h-4 w-4" />
                            Official
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {summaryOpen && (
        <InstallSummaryModal
          counts={summaryCounts}
          preflight={preflight}
          preflightLoading={preflightLoading}
          runnableSelected={runnableSelected}
          sourceVerification={sourceVerification}
          githubAssets={githubAssets}
          githubAssetNames={githubAssetNames}
          setGithubAssetNames={setGithubAssetNames}
          skippedSelected={skippedSelected}
          onClose={() => setSummaryOpen(false)}
          onStart={startInstallWithAssets}
        />
      )}

      {detailsId && (
        <AppDetailsModal
          app={apps.find((app) => app.id === detailsId) ?? null}
          status={appStatuses[detailsId] ?? "unknown"}
          onClose={() => setDetailsId(null)}
          onOpenSource={() => void window.miniHub.openSource(detailsId)}
        />
      )}
    </div>
  );
}

function InstallSummaryModal({
  counts,
  preflight,
  preflightLoading,
  runnableSelected,
  sourceVerification,
  githubAssets,
  githubAssetNames,
  setGithubAssetNames,
  skippedSelected,
  onClose,
  onStart
}: {
  counts: Record<string, number>;
  preflight: PreflightResult | null;
  preflightLoading: boolean;
  runnableSelected: AppDefinition[];
  sourceVerification: SourceVerification[];
  githubAssets: Record<string, GithubAsset[]>;
  githubAssetNames: Record<string, string>;
  setGithubAssetNames: (items: Record<string, string>) => void;
  skippedSelected: number;
  onClose: () => void;
  onStart: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4 backdrop-blur-sm">
      <Card className="animate-rise-in w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Start install queue?</CardTitle>
          <CardDescription>Preflight runs first, then only allowlisted app ids are passed to the main process.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-white/10 bg-black/[0.20] p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium">Preflight checks</div>
              <Badge tone={preflightLoading ? "warning" : preflight?.canRun ? "success" : preflight ? "error" : "muted"}>
                {preflightLoading ? "checking" : preflight?.canRun ? "ready" : preflight ? "attention" : "pending"}
              </Badge>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {preflightLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="rounded-md border border-white/10 bg-white/[0.035] p-2">
                    <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
                    <div className="mt-2 h-3 w-full animate-pulse rounded bg-white/10" />
                  </div>
                ))
              ) : (
                preflight?.checks.map((check) => (
                  <div key={check.id} className="rounded-md border border-white/10 bg-white/[0.035] p-2">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span>{check.label}</span>
                      <Badge tone={check.status === "ok" ? "success" : check.status === "warning" ? "warning" : "error"}>{check.status}</Badge>
                    </div>
                    <div className="mt-1 truncate text-xs text-muted-foreground">{check.detail}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            {(["winget", "github", "direct", "store"] as const).map((type) => (
              <div key={type} className="rounded-md border border-white/10 bg-white/[0.035] p-3">
                <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{type}</div>
                <div className="mt-1 text-2xl font-semibold">{counts[type] ?? 0}</div>
              </div>
            ))}
          </div>
          <div className="rounded-md border border-white/10 bg-black/[0.24] p-3 text-sm text-muted-foreground">
            {skippedSelected > 0
              ? `${skippedSelected} selected item(s) will be skipped because they are manual/source-required or already installed.`
              : "No selected items will be skipped."}
          </div>
          {sourceVerification.length > 0 && (
            <div className="rounded-md border border-white/10 bg-black/[0.24] p-3">
              <div className="mb-2 text-sm font-medium">Source verification</div>
              <div className="grid max-h-36 gap-2 overflow-auto">
                {sourceVerification.map((item) => (
                  <div key={item.appId} className="rounded-md border border-white/10 bg-white/[0.035] p-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate">{item.domain ?? item.repo ?? item.url ?? item.installType}</span>
                      <Badge tone={item.warnings.length > 0 ? "warning" : "success"}>{item.warnings.length > 0 ? "warning" : "verified"}</Badge>
                    </div>
                    {item.assetName && <div className="mt-1 truncate text-muted-foreground">Asset: {item.assetName}</div>}
                    {item.warnings.map((warning) => (
                      <div key={warning} className="mt-1 text-amber-100">
                        {warning}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
          {Object.values(githubAssets).some((items) => items.length > 1) && (
            <div className="rounded-md border border-amber-300/20 bg-amber-300/10 p-3">
              <div className="mb-2 text-sm font-medium text-amber-100">Choose GitHub release assets</div>
              <div className="grid gap-2">
                {Object.entries(githubAssets)
                  .filter(([, items]) => items.length > 1)
                  .map(([appId, items]) => {
                    const app = apps.find((item) => item.id === appId);
                    return (
                      <label key={appId} className="grid gap-1 text-xs">
                        <span className="text-amber-100/80">{app?.name ?? appId}</span>
                        <select
                          className="h-9 rounded-md border border-white/10 bg-black/[0.24] px-2 text-sm text-foreground"
                          value={githubAssetNames[appId] ?? items[0]?.name ?? ""}
                          onChange={(event) => setGithubAssetNames({ ...githubAssetNames, [appId]: event.currentTarget.value })}
                        >
                          {items.map((asset) => (
                            <option key={asset.name} value={asset.name}>
                              {asset.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    );
                  })}
              </div>
            </div>
          )}
          <div className="max-h-44 overflow-auto rounded-md border border-white/10 bg-black/[0.24] p-3">
            {runnableSelected.map((app) => (
              <div key={app.id} className="flex items-center justify-between gap-3 py-1 text-sm">
                <span className="min-w-0 truncate">{app.name}</span>
                <Badge tone={app.installType === "winget" ? "success" : "default"}>{app.installType}</Badge>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={runnableSelected.length === 0 || preflightLoading || preflight?.canRun === false} onClick={onStart}>
              <Download className="h-4 w-4" />
              Start
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RecommendationBlock({ items, title, tone }: { items: string[]; title: string; tone: "default" | "success" | "warning" }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.035] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-sm font-medium">{title}</div>
        <Badge tone={tone}>{items.length}</Badge>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.length > 0 ? items.map((item) => <Badge key={item} tone={tone}>{item}</Badge>) : <span className="text-xs text-muted-foreground">Nothing to show yet.</span>}
      </div>
    </div>
  );
}

function readProfiles(): AppProfile[] {
  try {
    const raw = localStorage.getItem("miniHub:profiles");
    if (raw) return JSON.parse(raw) as AppProfile[];
  } catch {
    // Keep default profiles below.
  }
  const now = new Date().toISOString();
  return [
    { id: "gaming", name: "Gaming", appIds: presets.find((preset) => preset.id === "gaming")?.appIds ?? [], updatedAt: now },
    { id: "developer", name: "Developer", appIds: presets.find((preset) => preset.id === "developer")?.appIds ?? [], updatedAt: now },
    { id: "clean-windows", name: "Clean Windows", appIds: presets.find((preset) => preset.id === "fresh-base")?.appIds ?? [], updatedAt: now },
    { id: "my-setup", name: "My setup", appIds: [], updatedAt: now }
  ];
}

function saveProfile(name: string, appIds: string[]) {
  const nextProfile: AppProfile = {
    id: name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || "my-setup",
    name: name.trim() || "My setup",
    appIds,
    updatedAt: new Date().toISOString()
  };
  const current = readProfiles().filter((profile) => profile.id !== nextProfile.id);
  const next = [...current, nextProfile];
  localStorage.setItem("miniHub:profiles", JSON.stringify(next));
  return next;
}

function AppDetailsModal({
  app,
  status,
  onClose,
  onOpenSource
}: {
  app: AppDefinition | null;
  status: AppInstallState;
  onClose: () => void;
  onOpenSource: () => void;
}) {
  if (!app) return null;

  const automatic = app.installType !== "manual" && !app.sourceRequired;
  const action =
    app.installType === "winget"
      ? `Runs: winget install --id ${app.wingetId ?? "<missing>"} -e`
      : app.installType === "store"
        ? `Runs WinGet against Microsoft Store source for ${app.wingetId ?? "<missing>"}`
        : app.installType === "github"
          ? `Downloads the latest .exe/.msi/.zip asset from ${app.repo ?? "GitHub Releases"}`
          : app.installType === "direct"
            ? "Downloads the configured official direct installer URL and opens it when it is .exe/.msi"
            : "Manual item. Automatic install is disabled until an official source is configured.";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/55 p-4 backdrop-blur-sm">
      <Card className="animate-rise-in w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <AppIcon app={app} />
            {app.name}
          </CardTitle>
          <CardDescription>{app.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <InfoBlock label="Source" value={app.installType} />
            <InfoBlock label="Status" value={statusLabel[status]} />
            <InfoBlock label="Category" value={app.category} />
          </div>
          <div className="rounded-md border border-white/10 bg-black/[0.24] p-3 text-sm leading-6 text-muted-foreground">
            <div className="font-medium text-foreground">What will happen</div>
            <div className="mt-1">{action}</div>
            {app.wingetId && <div className="mt-2">Winget ID: {app.wingetId}</div>}
            {app.repo && <div>GitHub repo: {app.repo}</div>}
            {app.sourceUrl && <div className="truncate">Official/source URL: {app.sourceUrl}</div>}
            {!automatic && <div className="mt-2 text-amber-100">This item will not be installed automatically.</div>}
          </div>
          <div className="flex justify-end gap-2">
            {app.sourceUrl && (
              <Button variant="secondary" onClick={onOpenSource}>
                <ExternalLink className="h-4 w-4" />
                Official page
              </Button>
            )}
            <Button onClick={onClose}>Close</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.035] p-3">
      <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mt-1 truncate text-sm font-medium">{value}</div>
    </div>
  );
}
