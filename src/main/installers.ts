import { BrowserWindow, app, shell } from "electron";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createHash } from "node:crypto";
import { createWriteStream } from "node:fs";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  AppDefinition,
  AppInstallState,
  InstallOptions,
  AppQueueItem,
  HubDownloadProgress,
  HubLogEvent,
  PreflightResult,
  SourceOverride,
  SourceVerification,
  SystemCheck
} from "../shared";
import { apps } from "../appCatalog";

export { apps } from "../appCatalog";

type LogSender = (event: Omit<HubLogEvent, "timestamp">) => void;
type QueueSender = (items: AppQueueItem[]) => void;
type ProgressSender = (progress: HubDownloadProgress) => void;

const appById = new Map(apps.map((item) => [item.id, item]));
let currentChild: ChildProcessWithoutNullStreams | null = null;
let cancelRequested = false;
let pauseRequested = false;

export function getAllowedAppIds() {
  return new Set(apps.map((item) => item.id));
}

export async function isRunningAsAdmin() {
  const output = await commandOutput("powershell.exe", [
    "-NoProfile",
    "-Command",
    "([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)"
  ]);
  return output.trim().toLowerCase() === "true";
}

export async function restartAsAdmin() {
  const exePath = process.execPath;
  const script = `Start-Process -FilePath '${escapePowerShellSingleQuoted(exePath)}' -Verb RunAs`;
  const ok = await commandSucceeds("powershell.exe", ["-NoProfile", "-Command", script]);
  if (ok) {
    app.quit();
  }
  return ok;
}

export function cancelInstallQueue(sendLog: LogSender) {
  cancelRequested = true;
  if (currentChild && !currentChild.killed) {
    currentChild.kill();
    sendLog({ source: "installer", level: "info", message: "Cancellation requested for the current process." });
  }
}

export function pauseInstallQueue(sendLog: LogSender) {
  pauseRequested = true;
  sendLog({ source: "installer", level: "warning", message: "Queue paused. Current installer will finish first." });
}

export function resumeInstallQueue(sendLog: LogSender) {
  pauseRequested = false;
  sendLog({ source: "installer", level: "info", message: "Queue resumed." });
}

export async function installSelectedApps(ids: string[], sendLog: LogSender, sendQueue: QueueSender, sendProgress?: ProgressSender, options?: InstallOptions) {
  cancelRequested = false;
  pauseRequested = false;
  const overrides = await readSourceOverrides();
  const queue = ids
    .map((id) => getEffectiveApp(id, overrides))
    .filter((item): item is AppDefinition => Boolean(item))
    .map<AppQueueItem>((item) => ({
      id: item.id,
      name: item.name,
      installType: item.installType,
      status: "queued"
    }));

  sendQueue(queue);

  for (const item of queue) {
    const definition = getEffectiveApp(item.id, overrides);
    if (!definition) {
      updateQueue(queue, item.id, { status: "skipped", detail: "Unknown app id." }, sendQueue);
      continue;
    }

    if (cancelRequested) {
      updateQueue(queue, item.id, { status: "cancelled", detail: "Queue cancelled." }, sendQueue);
      continue;
    }

    if (pauseRequested) {
      updateQueue(queue, item.id, { status: "paused", detail: "Waiting for resume." }, sendQueue);
      await waitUntilResumed();
      if (cancelRequested) {
        updateQueue(queue, item.id, { status: "cancelled", detail: "Queue cancelled." }, sendQueue);
        continue;
      }
    }

    updateQueue(queue, item.id, { status: "running", detail: "Starting..." }, sendQueue);

    try {
      if ((definition.installType === "winget" || definition.installType === "store") && definition.wingetId) {
        await runWingetInstall(definition, definition.wingetId, definition.wingetSource, sendLog);
        updateQueue(
          queue,
          item.id,
          cancelRequested
            ? { status: "cancelled", detail: "Queue cancelled." }
            : { status: "success", detail: "Installed through WinGet." },
          sendQueue
        );
        continue;
      }

      if (definition.installType === "direct" && definition.sourceUrl) {
        const filePath = await downloadDirectInstaller(definition, sendLog, sendProgress);
        updateQueue(queue, item.id, { status: "success", detail: `Downloaded ${path.basename(filePath)}.` }, sendQueue);
        continue;
      }

      if (definition.installType === "github" && definition.repo) {
        const assetPath = await downloadLatestGithubReleaseAsset(definition, sendLog, sendProgress, options?.githubAssetNames?.[definition.id]);
        updateQueue(queue, item.id, { status: "success", detail: `Downloaded ${path.basename(assetPath)}.` }, sendQueue);
        continue;
      }

      updateQueue(queue, item.id, { status: "skipped", detail: "Official source required." }, sendQueue);
      sendLog({
        source: "installer",
        level: "info",
        message: `${definition.name} requires a manual official source; automatic install skipped.`
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      updateQueue(queue, item.id, { status: cancelRequested ? "cancelled" : "error", detail: message }, sendQueue);
      if (!cancelRequested) {
        throw error;
      }
    }
  }
}

export async function updateInstalledApps(ids: string[], sendLog: LogSender, sendQueue: QueueSender) {
  const overrides = await readSourceOverrides();
  const queue = ids
    .map((id) => getEffectiveApp(id, overrides))
    .filter((item): item is AppDefinition => Boolean(item?.wingetId && (item.installType === "winget" || item.installType === "store")))
    .map<AppQueueItem>((item) => ({
      id: item.id,
      name: item.name,
      installType: item.installType,
      status: "queued"
    }));

  sendQueue(queue);

  for (const item of queue) {
    const definition = getEffectiveApp(item.id, overrides);
    if (!definition?.wingetId) continue;
    updateQueue(queue, item.id, { status: "running", detail: "Checking upgrade..." }, sendQueue);
    try {
      await runWingetUpgrade(definition, definition.wingetId, definition.wingetSource, sendLog);
      updateQueue(queue, item.id, { status: "success", detail: "Updated through WinGet." }, sendQueue);
    } catch (error) {
      updateQueue(queue, item.id, { status: "error", detail: error instanceof Error ? error.message : String(error) }, sendQueue);
    }
  }
}

export async function checkInstalledApps(ids: string[]): Promise<Record<string, AppInstallState>> {
  const result: Record<string, AppInstallState> = {};
  const overrides = await readSourceOverrides();

  for (const id of ids) {
    const item = getEffectiveApp(id, overrides);
    if (!item) {
      result[id] = "unknown";
      continue;
    }

    if (item.sourceRequired) {
      result[id] = "source_required";
      continue;
    }

    if (await knownInstalledByDetection(item)) {
      result[id] = "installed";
      continue;
    }

    if (await knownDownloadedFileExists(item)) {
      result[id] = "download_ready";
      continue;
    }

    if (!["winget", "store"].includes(item.installType) || !item.wingetId) {
      result[id] = item.installType === "manual" ? "source_required" : "unknown";
      continue;
    }

    if (await wingetPackageExists(item.wingetId)) {
      result[id] = (await wingetUpdateAvailable(item.wingetId)) ? "update_available" : "installed";
    } else {
      result[id] = "not_installed";
    }
  }

  return result;
}

export async function getSourceOverrides() {
  return Object.values(await readSourceOverrides());
}

export async function saveSourceOverride(appId: string, url: string) {
  const item = appById.get(appId);
  if (!item || typeof url !== "string") {
    throw new Error("Unknown app id or invalid source URL.");
  }

  const parsed = new URL(url);
  if (!["https:", "http:"].includes(parsed.protocol)) {
    throw new Error("Only http/https source URLs are allowed.");
  }

  const overrides = await readSourceOverrides();
  overrides[appId] = { appId, url, updatedAt: new Date().toISOString() };
  await writeSourceOverrides(overrides);
  return overrides[appId];
}

export async function removeSourceOverride(appId: string) {
  const overrides = await readSourceOverrides();
  delete overrides[appId];
  await writeSourceOverrides(overrides);
  return true;
}

export async function verifySources(ids: string[]): Promise<SourceVerification[]> {
  const overrides = await readSourceOverrides();
  const verifications: SourceVerification[] = [];

  for (const id of ids.filter((item) => appById.has(item))) {
    const item = getEffectiveApp(id, overrides);
    if (!item) continue;

    const warnings: string[] = [];
    let assetName: string | undefined;
    let assetCount: number | undefined;

    if ((item.installType === "direct" || item.installType === "manual") && item.sourceUrl) {
      const domain = getDomain(item.sourceUrl);
      if (item.sourceUrl.startsWith("http://")) {
        warnings.push("Source uses http, not https.");
      }
      verifications.push({ appId: item.id, installType: item.installType, domain, url: item.sourceUrl, warnings });
      continue;
    }

    if (item.installType === "github" && item.repo) {
      try {
        const release = await fetchLatestRelease(item.repo);
        const assets = release.assets?.filter((asset) => /\.(exe|msi|zip)$/i.test(asset.name)) ?? [];
        assetCount = assets.length;
        assetName = chooseReleaseAsset(assets)?.name;
        if (assets.length > 1) {
          warnings.push(`Multiple install assets found (${assets.length}); Windows Mini Hub will pick ${assetName ?? "the first compatible asset"}.`);
        }
        if (assets.length === 0) {
          warnings.push("No compatible .exe/.msi/.zip asset found.");
        }
      } catch (error) {
        warnings.push(error instanceof Error ? error.message : String(error));
      }
      verifications.push({
        appId: item.id,
        installType: item.installType,
        domain: "github.com",
        repo: item.repo,
        url: item.sourceUrl,
        assetName,
        assetCount,
        warnings
      });
    }
  }

  return verifications;
}

export async function getGithubAssets(ids: string[]) {
  const overrides = await readSourceOverrides();
  const result: Record<string, Array<{ name: string; downloadUrl: string; size?: number }>> = {};
  for (const id of ids) {
    const item = getEffectiveApp(id, overrides);
    if (!item?.repo || item.installType !== "github") continue;
    const release = await fetchLatestRelease(item.repo);
    result[id] =
      release.assets
        ?.filter((asset) => /\.(exe|msi|zip)$/i.test(asset.name))
        .map((asset) => ({ name: asset.name, downloadUrl: asset.browser_download_url, size: asset.size })) ?? [];
  }
  return result;
}

export async function runPreflightChecks(ids: string[]): Promise<PreflightResult> {
  const selectedIds = ids.filter((id) => appById.has(id));
  const [systemChecks, appStatuses, freeSpaceGb] = await Promise.all([
    runSystemChecks(),
    checkInstalledApps(selectedIds),
    getFreeSpaceGb(app.getPath("downloads"))
  ]);
  const downloadsFolder = path.join(app.getPath("downloads"), "Windows Mini Hub");
  await mkdir(downloadsFolder, { recursive: true });

  const wingetOk = systemChecks.find((check) => check.id === "winget")?.status === "ok";
  const internetOk = systemChecks.find((check) => check.id === "internet")?.status !== "error";
  const spaceOk = freeSpaceGb === null || freeSpaceGb >= 2;
  const checks = [
    ...systemChecks.map((check) => ({ ...check, required: check.id === "winget" || check.id === "internet" })),
    {
      id: "downloads-folder",
      label: "Downloads folder",
      status: "ok" as const,
      detail: downloadsFolder,
      required: true
    },
    {
      id: "free-space",
      label: "Free space",
      status: spaceOk ? ("ok" as const) : ("warning" as const),
      detail: freeSpaceGb === null ? "Could not determine free space." : `${freeSpaceGb.toFixed(1)} GB available near Downloads.`,
      required: false
    }
  ];

  return {
    canRun: Boolean(wingetOk && internetOk && spaceOk),
    downloadsFolder,
    freeSpaceGb,
    checks,
    appStatuses
  };
}

export async function runSystemChecks(): Promise<SystemCheck[]> {
  const [winget, powershell, admin, internet] = await Promise.all([
    commandSucceeds("winget", ["--version"]),
    commandSucceeds("powershell.exe", ["-NoProfile", "-Command", "$PSVersionTable.PSVersion.ToString()"]),
    commandOutput("powershell.exe", [
      "-NoProfile",
      "-Command",
      "([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)"
    ]).then((output) => output.trim().toLowerCase() === "true"),
    fetch("https://api.github.com", { headers: { "User-Agent": "Windows-Mini-Hub" } })
      .then((response) => response.ok)
      .catch(() => false)
  ]);

  return [
    {
      id: "winget",
      label: "WinGet",
      status: winget ? "ok" : "error",
      detail: winget ? "WinGet is available." : "WinGet was not found or did not respond."
    },
    {
      id: "powershell",
      label: "PowerShell",
      status: powershell ? "ok" : "error",
      detail: powershell ? "PowerShell is available." : "PowerShell was not found."
    },
    {
      id: "admin",
      label: "Administrator",
      status: admin ? "ok" : "warning",
      detail: admin ? "App is running with elevated privileges." : "Some installers may ask for elevation."
    },
    {
      id: "internet",
      label: "Internet",
      status: internet ? "ok" : "warning",
      detail: internet ? "GitHub API is reachable." : "GitHub API check failed; GitHub downloads may not work."
    }
  ];
}

export async function openSourcePage(id: string) {
  const item = getEffectiveApp(id, await readSourceOverrides());
  if (item?.sourceUrl) {
    await shell.openExternal(item.sourceUrl);
  }
}

export async function openDownloadsFolder() {
  const targetDir = path.join(app.getPath("downloads"), "Windows Mini Hub");
  await mkdir(targetDir, { recursive: true });
  await shell.openPath(targetDir);
}

function updateQueue(queue: AppQueueItem[], id: string, patch: Partial<AppQueueItem>, sendQueue: QueueSender) {
  const index = queue.findIndex((item) => item.id === id);
  if (index !== -1) {
    queue[index] = { ...queue[index], ...patch };
  }
  sendQueue([...queue]);
}

function runWingetInstall(
  appDefinition: AppDefinition,
  wingetId: string,
  wingetSource: AppDefinition["wingetSource"],
  sendLog: LogSender
) {
  return new Promise<void>((resolve, reject) => {
    sendLog({ source: "installer", level: "info", message: `Installing ${appDefinition.name} (${wingetId})` });
    const args = ["install", "--id", wingetId, "-e", "--accept-package-agreements", "--accept-source-agreements"];
    if (wingetSource) {
      args.push("--source", wingetSource);
    }
    const child = spawn(
      "winget",
      args,
      { windowsHide: true, shell: false }
    );
    currentChild = child;

    child.stdout.on("data", (chunk: Buffer) => sendProcessOutput("installer", "info", chunk, sendLog));
    child.stderr.on("data", (chunk: Buffer) => sendProcessOutput("installer", "error", chunk, sendLog));
    child.on("error", (error) => {
      currentChild = null;
      reject(new Error(`Could not start winget for ${appDefinition.name}: ${error.message}`));
    });
    child.on("close", (code) => {
      currentChild = null;
      if (cancelRequested) {
        resolve();
        return;
      }

      if (code === 0) {
        sendLog({ source: "installer", level: "success", message: `Installed ${appDefinition.name}` });
        resolve();
        return;
      }

      reject(new Error(`Install failed for ${appDefinition.name}. WinGet exited with code ${code ?? "unknown"}. Try running the app as administrator or check the package id ${wingetId}.`));
    });
  });
}

function runWingetUpgrade(
  appDefinition: AppDefinition,
  wingetId: string,
  wingetSource: AppDefinition["wingetSource"],
  sendLog: LogSender
) {
  return new Promise<void>((resolve, reject) => {
    sendLog({ source: "installer", level: "info", message: `Updating ${appDefinition.name} (${wingetId})` });
    const args = ["upgrade", "--id", wingetId, "-e", "--accept-package-agreements", "--accept-source-agreements"];
    if (wingetSource) {
      args.push("--source", wingetSource);
    }
    const child = spawn("winget", args, { windowsHide: true, shell: false });
    currentChild = child;

    child.stdout.on("data", (chunk: Buffer) => sendProcessOutput("installer", "info", chunk, sendLog));
    child.stderr.on("data", (chunk: Buffer) => sendProcessOutput("installer", "error", chunk, sendLog));
    child.on("error", (error) => {
      currentChild = null;
      reject(new Error(`Could not start winget upgrade for ${appDefinition.name}: ${error.message}`));
    });
    child.on("close", (code) => {
      currentChild = null;
      if (code === 0) {
        sendLog({ source: "installer", level: "success", message: `Updated ${appDefinition.name}` });
        resolve();
        return;
      }
      reject(new Error(`Update failed for ${appDefinition.name}. WinGet exited with code ${code ?? "unknown"}.`));
    });
  });
}

async function downloadDirectInstaller(appDefinition: AppDefinition, sendLog: LogSender, sendProgress?: ProgressSender) {
  if (!appDefinition.sourceUrl) {
    throw new Error("Direct source URL is missing.");
  }

  const targetDir = path.join(app.getPath("downloads"), "Windows Mini Hub");
  await mkdir(targetDir, { recursive: true });
  const targetPath = path.join(targetDir, getFileNameFromUrl(appDefinition.sourceUrl, appDefinition.id));
  const domain = getDomain(appDefinition.sourceUrl);

  sendLog({ source: "installer", level: "info", message: `Downloading ${appDefinition.name} from ${domain}.` });
  await downloadFile(appDefinition.sourceUrl, targetPath, appDefinition.id, sendProgress);
  const sha256 = await hashFile(targetPath);
  await saveDownloadedFile(appDefinition.id, targetPath, sha256);
  sendLog({ source: "installer", level: "success", message: `Downloaded ${path.basename(targetPath)} from ${domain}. SHA256: ${sha256}` });

  if (/\.(exe|msi)$/i.test(targetPath)) {
    await shell.openPath(targetPath);
    sendLog({ source: "installer", level: "info", message: `Opened installer: ${path.basename(targetPath)}` });
  } else {
    shell.showItemInFolder(targetPath);
  }

  return targetPath;
}

async function downloadLatestGithubReleaseAsset(appDefinition: AppDefinition, sendLog: LogSender, sendProgress?: ProgressSender, preferredAssetName?: string) {
  if (!appDefinition.repo) {
    throw new Error("GitHub repo is missing.");
  }

  sendLog({ source: "installer", level: "info", message: `Fetching latest release for ${appDefinition.repo}` });
  const release = await fetchLatestRelease(appDefinition.repo);
  const assets = release.assets?.filter((item) => /\.(exe|msi|zip)$/i.test(item.name)) ?? [];
  const asset = (preferredAssetName && assets.find((item) => item.name === preferredAssetName)) || chooseReleaseAsset(assets);
  if (assets.length > 1) {
    sendLog({
      source: "installer",
      level: "warning",
      message: `${appDefinition.repo} has ${assets.length} compatible assets. Using ${asset?.name ?? "first compatible asset"}.`
    });
  }

  if (!asset) {
    throw new Error(`No .exe, .msi, or .zip asset found for ${appDefinition.repo}`);
  }

  const targetDir = path.join(app.getPath("downloads"), "Windows Mini Hub");
  await mkdir(targetDir, { recursive: true });
  const targetPath = path.join(targetDir, asset.name);

  sendLog({
    source: "installer",
    level: "info",
    message: `Downloading ${asset.name}${release.tag_name ? ` (${release.tag_name})` : ""}`
  });

  await downloadFile(asset.browser_download_url, targetPath, appDefinition.id, sendProgress);
  const sha256 = await hashFile(targetPath);
  await saveDownloadedFile(appDefinition.id, targetPath, sha256);
  sendLog({ source: "installer", level: "success", message: `Downloaded ${asset.name} to ${targetDir}. SHA256: ${sha256}` });

  if (/\.(exe|msi)$/i.test(asset.name)) {
    await shell.openPath(targetPath);
    sendLog({ source: "installer", level: "info", message: `Opened installer: ${asset.name}` });
  }

  return targetPath;
}

async function fetchLatestRelease(repo: string) {
  const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
    headers: { "User-Agent": "Windows-Mini-Hub" }
  });

  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status} for ${repo}`);
  }

  return (await response.json()) as {
    tag_name?: string;
    assets?: Array<{ name: string; browser_download_url: string; size?: number }>;
  };
}

function chooseReleaseAsset(assets: Array<{ name: string; browser_download_url: string }>) {
  return (
    assets.find((item) => /setup|installer|x64|win/i.test(item.name) && /\.(exe|msi)$/i.test(item.name)) ??
    assets.find((item) => /\.(exe|msi)$/i.test(item.name)) ??
    assets[0]
  );
}

async function downloadFile(url: string, targetPath: string, appId: string, sendProgress?: ProgressSender) {
  const response = await fetch(url, { headers: { "User-Agent": "Windows-Mini-Hub" } });
  if (!response.ok || !response.body) {
    throw new Error(`Download failed with HTTP ${response.status}`);
  }

  const writer = createWriteStream(targetPath);
  const reader = response.body.getReader();
  const totalBytes = Number(response.headers.get("content-length") ?? 0) || undefined;
  let receivedBytes = 0;
  const startedAt = Date.now();
  const fileName = path.basename(targetPath);

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    const chunk = Buffer.from(value);
    receivedBytes += chunk.byteLength;
    writer.write(chunk);
    const elapsedSeconds = Math.max(0.25, (Date.now() - startedAt) / 1000);
    sendProgress?.({
      appId,
      fileName,
      receivedBytes,
      totalBytes,
      percent: totalBytes ? Math.min(100, Math.round((receivedBytes / totalBytes) * 100)) : undefined,
      speedBytesPerSecond: Math.round(receivedBytes / elapsedSeconds)
    });
  }

  await new Promise<void>((resolve, reject) => {
    writer.end(resolve);
    writer.on("error", reject);
  });
}

function getFileNameFromUrl(url: string, fallback: string) {
  try {
    const parsed = new URL(url);
    const lastSegment = decodeURIComponent(parsed.pathname.split("/").filter(Boolean).at(-1) ?? "");
    if (lastSegment && /\.[a-z0-9]{2,5}$/i.test(lastSegment)) {
      return sanitizeFileName(lastSegment);
    }
  } catch {
    // Fall through to fallback.
  }

  return `${sanitizeFileName(fallback)}.exe`;
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[<>:"/\\|?*]/g, "_");
}

function wingetPackageExists(wingetId: string) {
  return new Promise<boolean>((resolve) => {
    const child = spawn("winget", ["list", "--id", wingetId, "-e"], { windowsHide: true, shell: false });
    child.on("error", () => resolve(false));
    child.on("close", (code) => resolve(code === 0));
  });
}

function wingetUpdateAvailable(wingetId: string) {
  return new Promise<boolean>((resolve) => {
    const child = spawn("winget", ["upgrade", "--id", wingetId, "-e"], { windowsHide: true, shell: false });
    let output = "";
    child.stdout.on("data", (chunk: Buffer) => {
      output += chunk.toString("utf8");
    });
    child.on("error", () => resolve(false));
    child.on("close", (code) => {
      resolve(code === 0 && output.toLowerCase().includes(wingetId.toLowerCase()));
    });
  });
}

async function knownDownloadedFileExists(item: AppDefinition) {
  const metadata = await readDownloadedFiles();
  const filePath = metadata[item.id]?.filePath;
  if (filePath && (await fileExists(filePath))) return true;

  if (item.installType === "direct" && item.sourceUrl) {
    const targetPath = path.join(app.getPath("downloads"), "Windows Mini Hub", getFileNameFromUrl(item.sourceUrl, item.id));
    return fileExists(targetPath);
  }

  return false;
}

async function knownInstalledByDetection(item: AppDefinition) {
  const rules = item.detection ?? [
    { registryDisplayName: item.name },
    item.wingetId ? { registryDisplayName: item.wingetId.split(".").at(-1) } : {}
  ];

  for (const rule of rules) {
    if (rule.path && (await fileExists(expandWindowsPath(rule.path)))) {
      return true;
    }
    if (rule.registryDisplayName && (await registryDisplayNameExists(rule.registryDisplayName))) {
      return true;
    }
  }

  return false;
}

function registryDisplayNameExists(name: string) {
  const escaped = escapePowerShellSingleQuoted(name);
  const script = [
    "$paths = @(",
    "'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',",
    "'HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*',",
    "'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*'",
    ");",
    `$match = Get-ItemProperty $paths -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -like '*${escaped}*' } | Select-Object -First 1;`,
    "if ($match) { 'true' } else { 'false' }"
  ].join(" ");
  return commandOutput("powershell.exe", ["-NoProfile", "-Command", script]).then((output) => output.trim().toLowerCase() === "true");
}

function waitUntilResumed() {
  return new Promise<void>((resolve) => {
    const timer = setInterval(() => {
      if (!pauseRequested || cancelRequested) {
        clearInterval(timer);
        resolve();
      }
    }, 350);
  });
}

async function getFreeSpaceGb(targetPath: string) {
  const drive = path.parse(targetPath).root.replace(/\\$/, "");
  const output = await commandOutput("powershell.exe", [
    "-NoProfile",
    "-Command",
    `$drive = Get-PSDrive -Name '${drive.replace(":", "")}' -ErrorAction SilentlyContinue; if ($drive) { [math]::Round($drive.Free / 1GB, 2) }`
  ]);
  const value = Number.parseFloat(output.trim().replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

function getEffectiveApp(id: string, overrides: Record<string, SourceOverride>): AppDefinition | undefined {
  const item = appById.get(id);
  const override = overrides[id];
  if (!item || !override) return item;

  return {
    ...item,
    installType: item.installType === "manual" || item.sourceRequired ? "direct" : item.installType,
    sourceRequired: false,
    sourceUrl: override.url
  };
}

async function readSourceOverrides(): Promise<Record<string, SourceOverride>> {
  return readJsonFile<Record<string, SourceOverride>>(path.join(await getConfigDir(), "source-overrides.json"), {});
}

async function writeSourceOverrides(overrides: Record<string, SourceOverride>) {
  const configDir = await getConfigDir();
  await mkdir(configDir, { recursive: true });
  await writeFile(path.join(configDir, "source-overrides.json"), JSON.stringify(overrides, null, 2), "utf8");
}

async function readDownloadedFiles(): Promise<Record<string, { filePath: string; sha256: string; downloadedAt: string }>> {
  return readJsonFile(path.join(await getConfigDir(), "downloaded-files.json"), {});
}

async function saveDownloadedFile(appId: string, filePath: string, sha256: string) {
  const files = await readDownloadedFiles();
  files[appId] = { filePath, sha256, downloadedAt: new Date().toISOString() };
  const configDir = await getConfigDir();
  await mkdir(configDir, { recursive: true });
  await writeFile(path.join(configDir, "downloaded-files.json"), JSON.stringify(files, null, 2), "utf8");
}

export async function getPortableMode() {
  return fileExists(getPortableMarkerPath());
}

export async function setPortableMode(enabled: boolean) {
  const markerPath = getPortableMarkerPath();
  if (enabled) {
    await mkdir(path.dirname(markerPath), { recursive: true });
    await writeFile(markerPath, JSON.stringify({ enabled: true, updatedAt: new Date().toISOString() }, null, 2), "utf8");
    await mkdir(path.join(path.dirname(markerPath), "Windows Mini Hub Data"), { recursive: true });
  } else {
    await rm(markerPath, { force: true });
  }
  return getPortableMode();
}

async function getConfigDir() {
  if (await getPortableMode()) {
    return path.join(path.dirname(getPortableMarkerPath()), "Windows Mini Hub Data");
  }
  return app.getPath("userData");
}

function getPortableMarkerPath() {
  return path.join(getExecutableDir(), "portable-mode.json");
}

function getExecutableDir() {
  return app.isPackaged ? path.dirname(process.execPath) : process.cwd();
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await readFile(filePath, "utf8")) as T;
  } catch {
    return fallback;
  }
}

async function fileExists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function hashFile(filePath: string) {
  const data = await readFile(filePath);
  return createHash("sha256").update(data).digest("hex");
}

function getDomain(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return "unknown source";
  }
}

function expandWindowsPath(value: string) {
  return value.replace(/%([^%]+)%/g, (_match, name: string) => process.env[name] ?? "");
}

function escapePowerShellSingleQuoted(value: string) {
  return value.replace(/'/g, "''");
}

function commandSucceeds(command: string, args: string[]) {
  return new Promise<boolean>((resolve) => {
    const child = spawn(command, args, { windowsHide: true, shell: false });
    child.on("error", () => resolve(false));
    child.on("close", (code) => resolve(code === 0));
  });
}

function commandOutput(command: string, args: string[]) {
  return new Promise<string>((resolve) => {
    const child = spawn(command, args, { windowsHide: true, shell: false });
    let output = "";
    child.stdout.on("data", (chunk: Buffer) => {
      output += chunk.toString("utf8");
    });
    child.on("error", () => resolve(""));
    child.on("close", () => resolve(output));
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
    .filter((line) => !isProgressNoise(line))
    .filter(Boolean)
    .forEach((message) => sendLog({ source, level, message }));
}

function isProgressNoise(line: string) {
  if (/^[\\|/\-]+$/.test(line)) {
    return true;
  }

  if (/^[\u2588\u2592\s]+(\d{1,3}%|\d+(\.\d+)?\s*(KB|MB|GB)\s*\/\s*\d+(\.\d+)?\s*(KB|MB|GB))?$/i.test(line)) {
    return true;
  }

  return false;
}

export function sendToWindow(window: BrowserWindow, channel: string, payload: unknown) {
  if (!window.isDestroyed()) {
    window.webContents.send(channel, payload);
  }
}
