import { app, BrowserWindow, dialog, ipcMain } from "electron";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { AppQueueItem, DiagnosticsReport, HubDownloadProgress, HubLogEvent, HubStatus, InstallOptions } from "../shared";
import {
  apps,
  cancelInstallQueue,
  checkInstalledApps,
  getSourceOverrides,
  getGithubAssets,
  getPortableMode,
  installSelectedApps,
  isRunningAsAdmin,
  openDownloadsFolder,
  openSourcePage,
  pauseInstallQueue,
  removeSourceOverride,
  resumeInstallQueue,
  runPreflightChecks,
  runSystemChecks,
  restartAsAdmin,
  saveSourceOverride,
  sendToWindow,
  setPortableMode,
  updateInstalledApps,
  verifySources
} from "./installers";
import { applySelectedTweaks, tweaks } from "./tweaks";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let status: HubStatus = "idle";
const buildDate = new Date().toISOString();
const updateRepo = process.env.WINDOWS_MINI_HUB_UPDATE_REPO ?? "YOUR_GITHUB_USERNAME/windows-mini-hub";

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 760,
    minWidth: 980,
    minHeight: 640,
    title: "Windows Mini Hub",
    icon: path.join(__dirname, "../../build/icon.ico"),
    frame: false,
    backgroundColor: "#07111f",
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.setMenuBarVisibility(false);

  if (process.env.VITE_DEV_SERVER_URL) {
    void mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    void mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}

function emitLog(event: Omit<HubLogEvent, "timestamp">) {
  const payload: HubLogEvent = {
    ...event,
    timestamp: new Date().toISOString()
  };

  if (mainWindow) {
    sendToWindow(mainWindow, "hub:log", payload);
  }
}

function setStatus(nextStatus: HubStatus) {
  status = nextStatus;
  if (mainWindow) {
    sendToWindow(mainWindow, "hub:status", nextStatus);
  }
}

function emitQueue(items: AppQueueItem[]) {
  if (mainWindow) {
    sendToWindow(mainWindow, "hub:queue", items);
  }
}

function emitProgress(progress: HubDownloadProgress) {
  if (mainWindow) {
    sendToWindow(mainWindow, "hub:download-progress", progress);
  }
}

async function runExclusive(task: () => Promise<void>) {
  if (status === "running") {
    throw new Error("Another task is already running.");
  }

  setStatus("running");

  try {
    await task();
    setStatus("success");
  } catch (error) {
    setStatus("error");
    throw error;
  }
}

ipcMain.handle("hub:get-status", () => status);

ipcMain.handle("hub:app-info", () => ({
  name: "Windows Mini Hub",
  version: app.getVersion(),
  buildDate,
  updateRepo: updateRepo || undefined
}));

ipcMain.handle("hub:check-for-updates", async () => {
  if (!updateRepo || updateRepo.includes("YOUR_GITHUB_USERNAME")) {
    return {
      configured: false,
      currentVersion: app.getVersion(),
      message: "Auto-update check is ready, but no GitHub Releases repo is configured yet."
    };
  }

  const response = await fetch(`https://api.github.com/repos/${updateRepo}/releases/latest`, {
    headers: { "User-Agent": "Windows-Mini-Hub" }
  });
  if (!response.ok) {
    return { configured: true, currentVersion: app.getVersion(), message: `GitHub returned ${response.status}.` };
  }
  const release = (await response.json()) as { tag_name?: string; html_url?: string };
  const latestVersion = (release.tag_name ?? "").replace(/^v/i, "");
  const updateAvailable = Boolean(latestVersion && latestVersion !== app.getVersion());
  return {
    configured: true,
    currentVersion: app.getVersion(),
    latestVersion,
    releaseUrl: release.html_url,
    updateAvailable,
    message: updateAvailable ? `Version ${latestVersion} is available.` : "You are on the latest configured release."
  };
});

ipcMain.handle("hub:is-admin", () => isRunningAsAdmin());

ipcMain.handle("hub:restart-as-admin", () => restartAsAdmin());

ipcMain.handle("window:minimize", () => {
  mainWindow?.minimize();
});

ipcMain.handle("window:toggle-maximize", () => {
  if (!mainWindow) {
    return;
  }

  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.handle("window:close", () => {
  mainWindow?.close();
});

ipcMain.handle("hub:install-apps", async (_event, ids: string[], options?: InstallOptions) => {
  const allowed = new Set(apps.map((item) => item.id));
  const selectedIds = normalizeSelection(ids, allowed);

  await runExclusive(async () => {
    emitLog({
      source: "system",
      level: "info",
      message: `Starting app installation for ${selectedIds.length} item(s).`
    });
    await installSelectedApps(selectedIds, emitLog, emitQueue, emitProgress, options);
    emitLog({
      source: "system",
      level: "success",
      message: "App installation finished."
    });
  });
});

ipcMain.handle("hub:update-installed-apps", async (_event, ids: string[]) => {
  const allowed = new Set(apps.map((item) => item.id));
  const selectedIds = normalizeSelection(ids, allowed);
  await runExclusive(async () => {
    emitLog({ source: "system", level: "info", message: `Starting update for ${selectedIds.length} installed app(s).` });
    await updateInstalledApps(selectedIds, emitLog, emitQueue);
    emitLog({ source: "system", level: "success", message: "Update run finished." });
  });
});

ipcMain.handle("hub:cancel-install", () => {
  cancelInstallQueue(emitLog);
});

ipcMain.handle("hub:pause-install", () => {
  pauseInstallQueue(emitLog);
});

ipcMain.handle("hub:resume-install", () => {
  resumeInstallQueue(emitLog);
});

ipcMain.handle("hub:check-apps", async (_event, ids: string[]) => {
  const allowed = new Set(apps.map((item) => item.id));
  return checkInstalledApps(normalizeSelection(ids, allowed));
});

ipcMain.handle("hub:system-checks", () => runSystemChecks());

ipcMain.handle("hub:preflight", async (_event, ids: string[]) => {
  const allowed = new Set(apps.map((item) => item.id));
  return runPreflightChecks(normalizeSelection(ids, allowed));
});

ipcMain.handle("hub:downloads-folder", () => path.join(app.getPath("downloads"), "Windows Mini Hub"));

ipcMain.handle("hub:open-downloads-folder", () => openDownloadsFolder());

ipcMain.handle("hub:source-overrides", () => getSourceOverrides());

ipcMain.handle("hub:save-source-override", async (_event, appId: string, url: string) => {
  const allowed = new Set(apps.map((item) => item.id));
  if (!allowed.has(appId)) {
    throw new Error("Unknown app id.");
  }
  return saveSourceOverride(appId, url);
});

ipcMain.handle("hub:remove-source-override", async (_event, appId: string) => {
  const allowed = new Set(apps.map((item) => item.id));
  if (!allowed.has(appId)) {
    throw new Error("Unknown app id.");
  }
  return removeSourceOverride(appId);
});

ipcMain.handle("hub:verify-sources", async (_event, ids: string[]) => {
  const allowed = new Set(apps.map((item) => item.id));
  return verifySources(normalizeSelection(ids, allowed));
});

ipcMain.handle("hub:github-assets", async (_event, ids: string[]) => {
  const allowed = new Set(apps.map((item) => item.id));
  return getGithubAssets(normalizeSelection(ids, allowed));
});

ipcMain.handle("hub:portable-mode", () => getPortableMode());

ipcMain.handle("hub:set-portable-mode", (_event, enabled: boolean) => setPortableMode(Boolean(enabled)));

ipcMain.handle("hub:export-diagnostics", async (_event, report: DiagnosticsReport) => {
  const result = await dialog.showSaveDialog({
    title: "Export diagnostics",
    defaultPath: `windows-mini-hub-diagnostics-${new Date().toISOString().slice(0, 10)}.json`,
    filters: [{ name: "JSON", extensions: ["json"] }]
  });

  if (result.canceled || !result.filePath) {
    return false;
  }

  const [systemChecks, wingetVersion] = await Promise.all([
    runSystemChecks(),
    getWingetVersion()
  ]);

  await writeFile(
    result.filePath,
    JSON.stringify(
      {
        ...report,
        app: { name: "Windows Mini Hub", version: app.getVersion(), buildDate, updateRepo: updateRepo || undefined },
        windowsVersion: await getWindowsVersion(),
        isAdmin: systemChecks.find((check) => check.id === "admin")?.status === "ok",
        wingetVersion
      },
      null,
      2
    ),
    "utf8"
  );
  return true;
});

ipcMain.handle("hub:open-source", async (_event, id: string) => {
  if (typeof id === "string") {
    await openSourcePage(id);
  }
});

ipcMain.handle("hub:export-selection", async (_event, ids: string[]) => {
  const allowed = new Set(apps.map((item) => item.id));
  const selectedIds = normalizeSelection(ids, allowed);
  const result = await dialog.showSaveDialog({
    title: "Export app selection",
    defaultPath: "windows-mini-hub-selection.json",
    filters: [{ name: "JSON", extensions: ["json"] }]
  });

  if (result.canceled || !result.filePath) {
    return false;
  }

  await writeFile(
    result.filePath,
    JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), appIds: selectedIds }, null, 2),
    "utf8"
  );
  return true;
});

ipcMain.handle("hub:import-selection", async () => {
  const result = await dialog.showOpenDialog({
    title: "Import app selection",
    filters: [{ name: "JSON", extensions: ["json"] }],
    properties: ["openFile"]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return [];
  }

  const raw = await readFile(result.filePaths[0], "utf8");
  const parsed = JSON.parse(raw) as { appIds?: unknown };
  const allowed = new Set(apps.map((item) => item.id));
  return normalizeSelection(parsed.appIds, allowed);
});

ipcMain.handle("hub:apply-tweaks", async (_event, ids: string[]) => {
  const allowed = new Set(tweaks.map((item) => item.id));
  const selectedIds = normalizeSelection(ids, allowed);

  await runExclusive(async () => {
    emitLog({
      source: "system",
      level: "info",
      message: `Starting tweaks for ${selectedIds.length} item(s).`
    });
    await applySelectedTweaks(selectedIds, emitLog);
    emitLog({
      source: "system",
      level: "success",
      message: "Tweaks finished."
    });
  });
});

function normalizeSelection(ids: unknown, allowed: Set<string>) {
  if (!Array.isArray(ids)) {
    return [];
  }

  return ids.filter((id): id is string => typeof id === "string" && allowed.has(id));
}

async function getWindowsVersion() {
  try {
    const output = await runPowerShell("(Get-CimInstance Win32_OperatingSystem).Caption + ' ' + (Get-CimInstance Win32_OperatingSystem).Version");
    return output.trim() || "Unknown Windows version";
  } catch {
    return "Unknown Windows version";
  }
}

async function getWingetVersion() {
  try {
    return (await runCommand("winget", ["--version"])).trim() || "unknown";
  } catch {
    return "not available";
  }
}

function runPowerShell(command: string) {
  return runCommand("powershell.exe", ["-NoProfile", "-Command", command]);
}

function runCommand(command: string, args: string[]) {
  return new Promise<string>((resolve, reject) => {
    const child = import("node:child_process").then(({ spawn }) => {
      const process = spawn(command, args, { windowsHide: true, shell: false });
      let output = "";
      let errorOutput = "";
      process.stdout.on("data", (chunk: Buffer) => {
        output += chunk.toString("utf8");
      });
      process.stderr.on("data", (chunk: Buffer) => {
        errorOutput += chunk.toString("utf8");
      });
      process.on("error", reject);
      process.on("close", (code) => {
        if (code === 0) resolve(output);
        else reject(new Error(errorOutput || `${command} exited with code ${code ?? "unknown"}`));
      });
    });
    void child.catch(reject);
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
