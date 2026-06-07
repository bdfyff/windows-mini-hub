import { AlertTriangle, Download, FileDown, FolderDown, Monitor, Moon, RotateCw, ShieldAlert, ShieldCheck, SlidersHorizontal, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import type { AppInfo, AppStatusMap, HubLogEvent, UpdateCheckResult } from "../../../shared";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/card";
import { Checkbox } from "@/components/checkbox";
import { cn } from "@/lib/utils";

type SettingsPageProps = {
  animations: boolean;
  appInfo: AppInfo;
  appStatuses: AppStatusMap;
  compactMode: boolean;
  defaultPage: "dashboard" | "apps" | "tweaks" | "logs" | "sources" | "settings";
  isAdmin: boolean;
  logs: HubLogEvent[];
  refreshAdmin: () => void;
  restartAsAdmin: () => void;
  selectedApps: string[];
  setAnimations: (enabled: boolean) => void;
  setCompactMode: (enabled: boolean) => void;
  setDefaultPage: (page: "dashboard" | "apps" | "tweaks" | "logs" | "sources" | "settings") => void;
  setProMode: (enabled: boolean) => void;
  setSkipInstalled: (enabled: boolean) => void;
  setTheme: (theme: "dark" | "light" | "system") => void;
  proMode: boolean;
  skipInstalled: boolean;
  theme: "dark" | "light" | "system";
};

const themes = [
  { id: "dark", label: "Dark", icon: Moon },
  { id: "light", label: "Light", icon: Sun },
  { id: "system", label: "System", icon: Monitor }
] as const;

export function SettingsPage({
  animations,
  appInfo,
  appStatuses,
  compactMode,
  defaultPage,
  isAdmin,
  logs,
  refreshAdmin,
  restartAsAdmin,
  selectedApps,
  setAnimations,
  setCompactMode,
  setDefaultPage,
  setProMode,
  setSkipInstalled,
  setTheme,
  proMode,
  skipInstalled,
  theme
}: SettingsPageProps) {
  const [downloadsFolder, setDownloadsFolder] = useState("Downloads / Windows Mini Hub");
  const [portableMode, setPortableMode] = useState(false);
  const [updateCheck, setUpdateCheck] = useState<UpdateCheckResult | null>(null);

  useEffect(() => {
    void window.miniHub.getDownloadsFolder().then(setDownloadsFolder);
    void window.miniHub.getPortableMode().then(setPortableMode);
  }, []);

  const exportDiagnostics = async () => {
    await window.miniHub.exportDiagnostics({
      generatedAt: new Date().toISOString(),
      app: appInfo,
      windowsVersion: "",
      isAdmin,
      wingetVersion: "",
      selectedApps,
      appStatuses,
      lastErrors: logs.filter((log) => log.level === "error").slice(-20)
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Settings</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Tune the interface and review where downloaded installers are stored.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              Interface
            </CardTitle>
            <CardDescription>Desktop dashboard preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="mb-2 text-sm font-medium">Theme</div>
              <div className="grid gap-2 sm:grid-cols-3">
                {themes.map((item) => {
                  const Icon = item.icon;
                  const active = theme === item.id;
                  return (
                    <button
                      key={item.id}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.035] px-3 py-2 text-sm transition hover:bg-white/[0.07]",
                        active && "border-cyan-300/40 bg-cyan-300/10 text-cyan-100"
                      )}
                      onClick={() => setTheme(item.id)}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-md border border-white/10 bg-white/[0.035] p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">Portable mode</div>
                  <div className="mt-1 text-xs text-muted-foreground">Store configs/log metadata near the executable on next writes.</div>
                </div>
                <Checkbox
                  checked={portableMode}
                  onChange={async (event) => setPortableMode(await window.miniHub.setPortableMode(event.currentTarget.checked))}
                />
              </div>
            </div>

            <label className="flex items-center justify-between gap-4 rounded-md border border-white/10 bg-white/[0.035] p-3">
              <span>
                <span className="block text-sm font-medium">Compact mode</span>
                <span className="mt-1 block text-xs text-muted-foreground">Reduce spacing in dense app grids.</span>
              </span>
              <Checkbox checked={compactMode} onChange={(event) => setCompactMode(event.currentTarget.checked)} />
            </label>

            <label className="flex items-center justify-between gap-4 rounded-md border border-white/10 bg-white/[0.035] p-3">
              <span>
                <span className="block text-sm font-medium">Animations</span>
                <span className="mt-1 block text-xs text-muted-foreground">Use soft transitions and hover motion.</span>
              </span>
              <Checkbox checked={animations} onChange={(event) => setAnimations(event.currentTarget.checked)} />
            </label>

            <label className="flex items-center justify-between gap-4 rounded-md border border-amber-300/20 bg-amber-300/[0.08] p-3">
              <span>
                <span className="block text-sm font-medium text-amber-100">Pro mode</span>
                <span className="mt-1 block text-xs leading-5 text-amber-100/75">
                  Shows high-impact and manual-review tweaks. Pro mode does not bypass safety locks for security-removal actions.
                </span>
              </span>
              <Checkbox checked={proMode} onChange={(event) => setProMode(event.currentTarget.checked)} />
            </label>

            <label className="flex items-center justify-between gap-4 rounded-md border border-white/10 bg-white/[0.035] p-3">
              <span>
                <span className="block text-sm font-medium">Skip installed apps</span>
                <span className="mt-1 block text-xs text-muted-foreground">Do not include apps marked installed in the install queue.</span>
              </span>
              <Checkbox checked={skipInstalled} onChange={(event) => setSkipInstalled(event.currentTarget.checked)} />
            </label>

            <div>
              <div className="mb-2 text-sm font-medium">Default page</div>
              <div className="grid gap-2 sm:grid-cols-5">
                {(["dashboard", "apps", "tweaks", "logs", "sources", "settings"] as const).map((item) => (
                  <button
                    key={item}
                    className={cn(
                      "transition-smooth rounded-md border border-white/10 bg-white/[0.035] px-3 py-2 text-sm capitalize hover:-translate-y-0.5 hover:bg-white/[0.07]",
                      defaultPage === item && "border-cyan-300/40 bg-cyan-300/10 text-cyan-100"
                    )}
                    onClick={() => setDefaultPage(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderDown className="h-4 w-4 text-primary" />
              Downloads
            </CardTitle>
            <CardDescription>Direct and GitHub installers land here.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-white/10 bg-white/[0.035] p-3">
                <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Version</div>
                <div className="mt-1 text-sm font-medium">v{appInfo.version}</div>
                <div className="mt-1 text-xs text-muted-foreground">Build: {appInfo.buildDate ? new Date(appInfo.buildDate).toLocaleString() : "unknown"}</div>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.035] p-3">
                <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Changelog</div>
                <div className="mt-1 text-xs leading-5 text-muted-foreground">0.1.0: setup hub, scan, installer queue, sources, diagnostics, profiles.</div>
              </div>
            </div>
            <div className="mb-4 rounded-md border border-white/10 bg-white/[0.035] p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  {isAdmin ? <ShieldCheck className="h-4 w-4 text-emerald-300" /> : <ShieldAlert className="h-4 w-4 text-amber-300" />}
                  {isAdmin ? "Running as administrator" : "Running without administrator rights"}
                </div>
                <Badge tone={isAdmin ? "success" : "warning"}>{isAdmin ? "admin" : "standard"}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={restartAsAdmin} disabled={isAdmin}>
                  <ShieldCheck className="h-4 w-4" />
                  Restart as administrator
                </Button>
                <Button size="sm" variant="ghost" onClick={refreshAdmin}>
                  <RotateCw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </div>
            <div className="rounded-md border border-white/10 bg-black/25 p-3 font-mono text-xs text-slate-300">
              {downloadsFolder}
            </div>
            <div className="mt-4 rounded-md border border-amber-300/20 bg-amber-300/10 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-200" />
                <div>
                  <div className="text-sm font-medium text-amber-100">System commands require administrator rights</div>
                  <p className="mt-1 text-xs leading-5 text-amber-100/75">
                    Some installers and tweaks may ask for elevation. Avoid running unknown setup files.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Badge tone="default">direct</Badge>
              <Badge tone="default">github</Badge>
              <Badge tone="success">winget</Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={exportDiagnostics}>
                <FileDown className="h-4 w-4" />
                Export diagnostics
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={async () => setUpdateCheck(await window.miniHub.checkForUpdates())}
              >
                <Download className="h-4 w-4" />
                Check Mini Hub update
              </Button>
            </div>
            {updateCheck && (
              <div className="mt-3 rounded-md border border-white/10 bg-white/[0.035] p-3 text-sm text-muted-foreground">
                {updateCheck.message}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
