import { spawn } from "node:child_process";
import type { HubLogEvent, TweakDefinition } from "../shared";
import { tweaks } from "../tweaksCatalog";

export { tweaks } from "../tweaksCatalog";

type LogSender = (event: Omit<HubLogEvent, "timestamp">) => void;

const tweakById = new Map(tweaks.map((tweak) => [tweak.id, tweak]));

export function getAllowedTweakIds() {
  return new Set(tweaks.map((tweak) => tweak.id));
}

export async function applySelectedTweaks(ids: string[], sendLog: LogSender) {
  for (const id of ids) {
    const tweak = tweakById.get(id);

    if (!tweak) {
      sendLog({
        source: "tweak",
        level: "error",
        message: `Skipped unknown tweak id: ${id}`
      });
      continue;
    }

    if (tweak.blocked || !tweak.command) {
      sendLog({
        source: "tweak",
        level: "warning",
        message: `Skipped blocked tweak: ${tweak.name}. ${tweak.blockedReason ?? "No safe command is configured."}`
      });
      continue;
    }

    sendLog({
      source: "tweak",
      level: "info",
      message: `Applying tweak: ${tweak.name}`
    });

    await runPowerShellCommand(tweak, sendLog);
  }
}

function runPowerShellCommand(tweak: TweakDefinition, sendLog: LogSender) {
  return new Promise<void>((resolve, reject) => {
    if (!tweak.command) {
      reject(new Error(`No PowerShell command configured for ${tweak.name}`));
      return;
    }

    const command = tweak.command;
    const child = spawn(
      "powershell.exe",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command],
      {
        windowsHide: true,
        shell: false
      }
    );

    child.stdout.on("data", (chunk: Buffer) => {
      sendProcessOutput("tweak", "info", chunk, sendLog);
    });

    child.stderr.on("data", (chunk: Buffer) => {
      sendProcessOutput("tweak", "error", chunk, sendLog);
    });

    child.on("error", (error) => {
      sendLog({
        source: "tweak",
        level: "error",
        message: `Failed to start PowerShell for ${tweak.name}: ${error.message}`
      });
      reject(error);
    });

    child.on("close", (code) => {
      if (code === 0) {
        sendLog({
          source: "tweak",
          level: "success",
          message: `Applied tweak: ${tweak.name}`
        });
        resolve();
        return;
      }

      const error = new Error(`PowerShell exited with code ${code ?? "unknown"} for ${tweak.name}`);
      sendLog({
        source: "tweak",
        level: "error",
        message: error.message
      });
      reject(error);
    });
  });
}

function sendProcessOutput(
  source: HubLogEvent["source"],
  level: HubLogEvent["level"],
  chunk: Buffer,
  sendLog: LogSender
) {
  chunk
    .toString("utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((message) => sendLog({ source, level, message }));
}
