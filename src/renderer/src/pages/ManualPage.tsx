import { ExternalLink, Link2, Link2Off, RotateCw, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { SourceOverride } from "../../../shared";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/card";
import { apps } from "@/data/apps";

export function ManualPage() {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [overrides, setOverrides] = useState<Record<string, SourceOverride>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const sourceRequiredApps = useMemo(() => apps.filter((app) => app.installType === "manual" || app.sourceRequired), []);
  const githubApps = apps.filter((app) => app.installType === "github");
  const directApps = apps.filter((app) => app.installType === "direct" || app.installType === "store");

  const loadOverrides = async () => {
    const items = await window.miniHub.getSourceOverrides();
    setOverrides(Object.fromEntries(items.map((item) => [item.appId, item])));
    setDrafts((current) => ({ ...Object.fromEntries(items.map((item) => [item.appId, item.url])), ...current }));
  };

  useEffect(() => {
    void loadOverrides();
  }, []);

  const saveOverride = async (appId: string) => {
    const url = drafts[appId]?.trim();
    if (!url) return;
    setSavingId(appId);
    try {
      const saved = await window.miniHub.saveSourceOverride(appId, url);
      setOverrides((current) => ({ ...current, [appId]: saved }));
    } finally {
      setSavingId(null);
    }
  };

  const removeOverride = async (appId: string) => {
    await window.miniHub.removeSourceOverride(appId);
    setOverrides((current) => {
      const next = { ...current };
      delete next[appId];
      return next;
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Sources</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Configure official URLs for apps that should stay manual until a trusted source is provided.
          </p>
        </div>
        <Button variant="secondary" onClick={() => void loadOverrides()}>
          <RotateCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Source required editor</CardTitle>
          <CardDescription>Saved URLs are stored in the app data folder and used by the main process by app id.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-2">
          {sourceRequiredApps.length === 0 ? (
            <div className="rounded-md border border-dashed border-white/10 bg-white/[0.035] p-5 text-sm text-muted-foreground">
              No source-required apps are currently configured. Direct, GitHub, Store, and WinGet apps already have sources.
            </div>
          ) : (
            sourceRequiredApps.map((app) => (
              <div key={app.id} className="rounded-md border border-white/10 bg-white/[0.035] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{app.name}</div>
                    <div className="mt-1 text-sm leading-6 text-muted-foreground">{app.description}</div>
                  </div>
                  <Badge tone={overrides[app.id] ? "success" : "warning"}>{overrides[app.id] ? "custom source" : "source required"}</Badge>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  {overrides[app.id] ? <Link2 className="h-3.5 w-3.5" /> : <Link2Off className="h-3.5 w-3.5" />}
                  {overrides[app.id] ? `Saved ${new Date(overrides[app.id].updatedAt).toLocaleString()}` : "No automatic installer is configured."}
                </div>
                <input
                  className="mt-3 h-10 w-full rounded-md border border-white/10 bg-black/[0.18] px-3 text-sm outline-none transition focus:border-cyan-300/40 focus:ring-2 focus:ring-cyan-300/15"
                  onChange={(event) => setDrafts((current) => ({ ...current, [app.id]: event.currentTarget.value }))}
                  placeholder="https://official.vendor/download.exe"
                  value={drafts[app.id] ?? overrides[app.id]?.url ?? ""}
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => void saveOverride(app.id)} disabled={savingId === app.id || !drafts[app.id]?.trim()}>
                    <Save className="h-4 w-4" />
                    Save source
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => void removeOverride(app.id)} disabled={!overrides[app.id]}>
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Direct and Store sources</CardTitle>
          <CardDescription>Verified sources provided for direct download or Microsoft Store install.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-2">
          {directApps.map((app) => (
            <SourceCard key={app.id} app={app} badge={app.installType} />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>GitHub Releases</CardTitle>
          <CardDescription>These can be downloaded from latest GitHub release assets.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-2">
          {githubApps.map((app) => (
            <SourceCard key={app.id} app={app} badge="github" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function SourceCard({ app, badge }: { app: (typeof apps)[number]; badge: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.035] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium">{app.name}</div>
          <div className="mt-1 text-sm leading-6 text-muted-foreground">{app.description}</div>
          {app.repo && <div className="mt-2 text-xs text-muted-foreground">Repo: {app.repo}</div>}
        </div>
        <Badge tone="default">{badge}</Badge>
      </div>
      <Button className="mt-4" size="sm" variant="secondary" onClick={() => void window.miniHub.openSource(app.id)}>
        <ExternalLink className="h-4 w-4" />
        Open source
      </Button>
    </div>
  );
}
