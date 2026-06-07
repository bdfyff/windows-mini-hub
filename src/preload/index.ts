import { contextBridge, ipcRenderer } from "electron";
import type {
  AppQueueItem,
  AppInfo,
  AppStatusMap,
  DiagnosticsReport,
  GithubAsset,
  HubDownloadProgress,
  HubLogEvent,
  HubStatus,
  InstallOptions,
  PreflightResult,
  SourceOverride,
  SourceVerification,
  SystemCheck
} from "../shared";

contextBridge.exposeInMainWorld("miniHub", {
  installApps: (ids: string[], options?: InstallOptions) => ipcRenderer.invoke("hub:install-apps", ids, options),
  updateInstalledApps: (ids: string[]) => ipcRenderer.invoke("hub:update-installed-apps", ids),
  cancelInstall: () => ipcRenderer.invoke("hub:cancel-install"),
  pauseInstall: () => ipcRenderer.invoke("hub:pause-install"),
  resumeInstall: () => ipcRenderer.invoke("hub:resume-install"),
  checkApps: (ids: string[]) => ipcRenderer.invoke("hub:check-apps", ids) as Promise<AppStatusMap>,
  runPreflight: (ids: string[]) => ipcRenderer.invoke("hub:preflight", ids) as Promise<PreflightResult>,
  runSystemChecks: () => ipcRenderer.invoke("hub:system-checks") as Promise<SystemCheck[]>,
  getDownloadsFolder: () => ipcRenderer.invoke("hub:downloads-folder") as Promise<string>,
  openDownloadsFolder: () => ipcRenderer.invoke("hub:open-downloads-folder"),
  openSource: (id: string) => ipcRenderer.invoke("hub:open-source", id),
  exportSelection: (ids: string[]) => ipcRenderer.invoke("hub:export-selection", ids) as Promise<boolean>,
  importSelection: () => ipcRenderer.invoke("hub:import-selection") as Promise<string[]>,
  applyTweaks: (ids: string[]) => ipcRenderer.invoke("hub:apply-tweaks", ids),
  getStatus: () => ipcRenderer.invoke("hub:get-status") as Promise<HubStatus>,
  isAdmin: () => ipcRenderer.invoke("hub:is-admin") as Promise<boolean>,
  restartAsAdmin: () => ipcRenderer.invoke("hub:restart-as-admin") as Promise<boolean>,
  getSourceOverrides: () => ipcRenderer.invoke("hub:source-overrides") as Promise<SourceOverride[]>,
  saveSourceOverride: (appId: string, url: string) => ipcRenderer.invoke("hub:save-source-override", appId, url) as Promise<SourceOverride>,
  removeSourceOverride: (appId: string) => ipcRenderer.invoke("hub:remove-source-override", appId) as Promise<boolean>,
  verifySources: (ids: string[]) => ipcRenderer.invoke("hub:verify-sources", ids) as Promise<SourceVerification[]>,
  getGithubAssets: (ids: string[]) => ipcRenderer.invoke("hub:github-assets", ids) as Promise<Record<string, GithubAsset[]>>,
  getAppInfo: () => ipcRenderer.invoke("hub:app-info") as Promise<AppInfo>,
  checkForUpdates: () => ipcRenderer.invoke("hub:check-for-updates"),
  exportDiagnostics: (report: DiagnosticsReport) => ipcRenderer.invoke("hub:export-diagnostics", report) as Promise<boolean>,
  getPortableMode: () => ipcRenderer.invoke("hub:portable-mode") as Promise<boolean>,
  setPortableMode: (enabled: boolean) => ipcRenderer.invoke("hub:set-portable-mode", enabled) as Promise<boolean>,
  minimizeWindow: () => ipcRenderer.invoke("window:minimize"),
  toggleMaximizeWindow: () => ipcRenderer.invoke("window:toggle-maximize"),
  closeWindow: () => ipcRenderer.invoke("window:close"),
  onLog: (callback: (event: HubLogEvent) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: HubLogEvent) => callback(payload);
    ipcRenderer.on("hub:log", listener);
    return () => ipcRenderer.removeListener("hub:log", listener);
  },
  onStatus: (callback: (status: HubStatus) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: HubStatus) => callback(payload);
    ipcRenderer.on("hub:status", listener);
    return () => ipcRenderer.removeListener("hub:status", listener);
  },
  onQueue: (callback: (items: AppQueueItem[]) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: AppQueueItem[]) => callback(payload);
    ipcRenderer.on("hub:queue", listener);
    return () => ipcRenderer.removeListener("hub:queue", listener);
  },
  onDownloadProgress: (callback: (progress: HubDownloadProgress) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: HubDownloadProgress) => callback(payload);
    ipcRenderer.on("hub:download-progress", listener);
    return () => ipcRenderer.removeListener("hub:download-progress", listener);
  }
});
