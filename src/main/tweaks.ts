import { spawn } from "node:child_process";
import type { HubLogEvent, TweakDefinition } from "../shared";

export const tweaks: TweakDefinition[] = [
  {
    id: "show-file-extensions",
    name: "Show file extensions",
    description: "Show extensions for known file types in File Explorer.",
    group: "Safe",
    risk: "low",
    command:
      "Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced' -Name HideFileExt -Type DWord -Value 0"
  },
  {
    id: "enable-dark-mode",
    name: "Enable dark mode",
    description: "Use dark theme for Windows apps and system surfaces.",
    group: "Safe",
    risk: "low",
    command:
      "Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize' -Name AppsUseLightTheme -Type DWord -Value 0; Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize' -Name SystemUsesLightTheme -Type DWord -Value 0"
  },
  {
    id: "enable-clipboard-history",
    name: "Enable clipboard history",
    description: "Turn on Windows clipboard history.",
    group: "Balanced",
    risk: "medium",
    command:
      "Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Clipboard' -Name EnableClipboardHistory -Type DWord -Value 1"
  },
  {
    id: "show-hidden-files",
    name: "Show hidden files",
    description: "Show hidden files and folders in File Explorer.",
    group: "Balanced",
    risk: "medium",
    command:
      "Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced' -Name Hidden -Type DWord -Value 1"
  }
];

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
    const child = spawn(
      "powershell.exe",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", tweak.command],
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
