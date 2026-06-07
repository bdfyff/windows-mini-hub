import { Activity, RefreshCw } from "lucide-react";
import type { SystemCheck } from "../../../shared";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/card";

type SystemPageProps = {
  checks: SystemCheck[];
  setChecks: (checks: SystemCheck[]) => void;
};

const tone = {
  ok: "success",
  warning: "warning",
  error: "error"
} as const;

export function SystemPage({ checks, setChecks }: SystemPageProps) {
  const runChecks = async () => {
    setChecks(await window.miniHub.runSystemChecks());
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">System Checks</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Check the basics before installing: WinGet, PowerShell, and elevation state.
          </p>
        </div>
        <Button onClick={runChecks}>
          <RefreshCw className="h-4 w-4" />
          Run checks
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(checks.length > 0 ? checks : placeholderChecks).map((check) => (
          <Card key={check.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                {check.label}
              </CardTitle>
              <CardDescription>{check.detail}</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge tone={tone[check.status]}>{check.status}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

const placeholderChecks: SystemCheck[] = [
  { id: "winget", label: "WinGet", status: "warning", detail: "Not checked yet." },
  { id: "powershell", label: "PowerShell", status: "warning", detail: "Not checked yet." },
  { id: "admin", label: "Administrator", status: "warning", detail: "Not checked yet." },
  { id: "internet", label: "Internet", status: "warning", detail: "Not checked yet." }
];
