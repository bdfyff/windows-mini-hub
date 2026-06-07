import { AlertTriangle, CheckCircle2, Gauge, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { TweakDefinition } from "../../../shared";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/card";
import { Checkbox } from "@/components/checkbox";
import { tweaks } from "@/data/tweaks";

type TweaksPageProps = {
  isRunning: boolean;
};

const groupMeta = {
  Safe: {
    icon: ShieldCheck,
    description: "Low-risk current-user changes suitable for a fresh install.",
    tone: "success" as const
  },
  Balanced: {
    icon: Gauge,
    description: "Useful defaults that may change familiar Windows behavior.",
    tone: "default" as const
  },
  Advanced: {
    icon: AlertTriangle,
    description: "Reserved for higher-impact tweaks. Review carefully before applying.",
    tone: "warning" as const
  }
};

const riskTone = {
  low: "success",
  medium: "warning",
  high: "error"
} as const;

export function TweaksPage({ isRunning }: TweaksPageProps) {
  const [selected, setSelected] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem("miniHub:selectedTweaks");
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("miniHub:selectedTweaks", JSON.stringify(selected));
  }, [selected]);

  const grouped = useMemo(() => {
    return (["Safe", "Balanced", "Advanced"] as const).map((group) => ({
      group,
      items: tweaks.filter((tweak) => (tweak.group ?? "Safe") === group)
    }));
  }, []);

  const toggleTweak = (id: string) => {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const applySelected = async () => {
    const selectedTweaks = tweaks.filter((tweak) => selected.includes(tweak.id));
    const hasAdvanced = selectedTweaks.some((tweak) => tweak.group === "Advanced" || tweak.risk === "high");
    const ok = window.confirm(
      hasAdvanced
        ? "Advanced tweaks can have broader impact. Apply selected tweaks?"
        : "These tweaks change current-user Windows settings. Apply selected tweaks?"
    );

    if (ok) {
      await window.miniHub.applyTweaks(selected);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Tweaks</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Carefully grouped Windows adjustments with risk labels and confirmation before execution.
          </p>
        </div>
        <Button disabled={selected.length === 0 || isRunning} onClick={applySelected}>
          <Sparkles className="h-4 w-4" />
          Apply selected
          <Badge tone="muted">{selected.length}</Badge>
        </Button>
      </div>

      <div className="grid gap-4">
        {grouped.map(({ group, items }) => {
          const Icon = groupMeta[group].icon;
          return (
            <Card key={group}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary" />
                    {group}
                  </CardTitle>
                  <CardDescription>{groupMeta[group].description}</CardDescription>
                </div>
                <Badge tone={groupMeta[group].tone}>{items.length} tweaks</Badge>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <div className="rounded-md border border-dashed border-white/[0.12] bg-white/[0.025] p-5 text-sm text-muted-foreground">
                    No {group.toLowerCase()} tweaks configured yet.
                  </div>
                ) : (
                  <div className="grid gap-3 lg:grid-cols-2">
                    {items.map((tweak: TweakDefinition) => {
                      const checked = selected.includes(tweak.id);
                      const risk = tweak.risk ?? "low";

                      return (
                        <label
                          key={tweak.id}
                          className={
                            checked
                              ? "flex cursor-pointer items-start gap-3 rounded-lg border border-cyan-300/35 bg-cyan-300/[0.07] p-4 shadow-lg shadow-cyan-950/15"
                              : "flex cursor-pointer items-start gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-4 transition hover:border-white/[0.18] hover:bg-white/[0.055]"
                          }
                        >
                          <Checkbox checked={checked} onChange={() => toggleTweak(tweak.id)} />
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="font-medium">{tweak.name}</span>
                              <Badge tone={riskTone[risk]}>{risk} risk</Badge>
                              {checked && (
                                <Badge tone="default">
                                  <CheckCircle2 className="mr-1 h-3 w-3" />
                                  selected
                                </Badge>
                              )}
                            </span>
                            <span className="mt-1 block text-sm leading-6 text-muted-foreground">{tweak.description}</span>
                            {group === "Advanced" && (
                              <span className="mt-2 flex items-center gap-2 text-xs text-amber-100">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                Review this tweak before applying.
                              </span>
                            )}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
