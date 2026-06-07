import { CheckCircle2, Download, FolderOpen, ShieldCheck, Sparkles, Wifi, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { SystemCheck } from "../../../shared";
import { Badge } from "./badge";
import { Button } from "./button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { presets } from "@/data/presets";

type OnboardingProps = {
  onClose: () => void;
  onOpenApps: () => void;
  onPreset: (ids: string[]) => void;
};

const iconById = {
  winget: Download,
  internet: Wifi,
  admin: ShieldCheck,
  powershell: Sparkles
} as const;

export function Onboarding({ onClose, onOpenApps, onPreset }: OnboardingProps) {
  const [checks, setChecks] = useState<SystemCheck[]>([]);
  const [downloadsFolder, setDownloadsFolder] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([window.miniHub.runSystemChecks(), window.miniHub.getDownloadsFolder()])
      .then(([nextChecks, folder]) => {
        if (!mounted) return;
        setChecks(nextChecks);
        setDownloadsFolder(folder);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const recommended = presets.find((preset) => preset.id === "fresh-base") ?? presets[0];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-md">
      <Card className="animate-rise-in w-full max-w-3xl overflow-hidden">
        <CardHeader className="relative border-b border-white/10 bg-gradient-to-br from-cyan-300/[0.10] to-violet-400/[0.10]">
          <button className="absolute right-4 top-4 text-muted-foreground transition hover:text-white" onClick={onClose} type="button">
            <X className="h-4 w-4" />
          </button>
          <Badge tone="default" className="mb-3 w-fit">
            first run
          </Badge>
          <CardTitle className="text-2xl">Welcome to Windows Mini Hub</CardTitle>
          <CardDescription>Quickly check the essentials, then pick a clean setup preset.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 p-5">
          <div className="grid gap-3 md:grid-cols-2">
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                  <div className="h-4 w-28 animate-pulse rounded bg-white/10" />
                  <div className="mt-3 h-3 w-full animate-pulse rounded bg-white/10" />
                  <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-white/10" />
                </div>
              ))
            ) : (
              checks.map((check) => {
                const Icon = iconById[check.id as keyof typeof iconById] ?? CheckCircle2;
                return (
                  <div key={check.id} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 font-medium">
                        <Icon className="h-4 w-4 text-cyan-200" />
                        {check.label}
                      </div>
                      <Badge tone={check.status === "ok" ? "success" : check.status === "warning" ? "warning" : "error"}>{check.status}</Badge>
                    </div>
                    <div className="mt-2 text-sm leading-5 text-muted-foreground">{check.detail}</div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/[0.20] p-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 font-medium">
                <FolderOpen className="h-4 w-4 text-cyan-200" />
                Downloads folder
              </div>
              <div className="mt-1 truncate text-sm text-muted-foreground">{downloadsFolder || "Resolving..."}</div>
            </div>
            <Button variant="secondary" onClick={() => void window.miniHub.openDownloadsFolder()}>
              Open folder
            </Button>
          </div>

          <div className="rounded-lg border border-cyan-300/20 bg-cyan-300/[0.07] p-4">
            <div className="font-semibold">{recommended.name}</div>
            <div className="mt-1 text-sm leading-5 text-muted-foreground">{recommended.description}</div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  onPreset(recommended.appIds);
                  onOpenApps();
                  onClose();
                }}
              >
                <Sparkles className="h-4 w-4" />
                Use recommended
              </Button>
              <Button variant="secondary" onClick={onClose}>
                Decide later
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
