import type { AppQueueItem, AppStatusMap, HubDownloadProgress, HubLogEvent, HubStatus, PreflightResult, SystemCheck } from "../../../shared";

export function installBrowserFallback() {
  if (window.miniHub) {
    return;
  }

  const noop = async () => undefined;

  window.miniHub = {
    installApps: noop,
    updateInstalledApps: noop,
    cancelInstall: noop,
    pauseInstall: noop,
    resumeInstall: noop,
    checkApps: async () => ({}) satisfies AppStatusMap,
    runPreflight: async () =>
      ({
        canRun: true,
        downloadsFolder: "Downloads / Windows Mini Hub",
        freeSpaceGb: 120,
        checks: [],
        appStatuses: {}
      }) satisfies PreflightResult,
    runSystemChecks: async () => [] satisfies SystemCheck[],
    getDownloadsFolder: async () => "Downloads / Windows Mini Hub",
    openDownloadsFolder: noop,
    openSource: noop,
    exportSelection: async () => false,
    importSelection: async () => [],
    applyTweaks: noop,
    getStatus: async () => "idle" satisfies HubStatus,
    isAdmin: async () => false,
    restartAsAdmin: async () => false,
    getSourceOverrides: async () => [],
    saveSourceOverride: async (appId: string, url: string) => ({ appId, url, updatedAt: new Date().toISOString() }),
    removeSourceOverride: async () => true,
    verifySources: async () => [],
    getGithubAssets: async () => ({}),
    getAppInfo: async () => ({ name: "Windows Mini Hub", version: "0.1.0", buildDate: new Date().toISOString() }),
    checkForUpdates: async () => ({ configured: false, currentVersion: "0.1.0", message: "Auto-update repo is not configured." }),
    exportDiagnostics: async () => false,
    getPortableMode: async () => false,
    setPortableMode: async (enabled: boolean) => enabled,
    minimizeWindow: noop,
    toggleMaximizeWindow: noop,
    closeWindow: noop,
    onLog: (_callback: (event: HubLogEvent) => void) => () => undefined,
    onStatus: (_callback: (status: HubStatus) => void) => () => undefined,
    onQueue: (_callback: (items: AppQueueItem[]) => void) => () => undefined,
    onDownloadProgress: (_callback: (progress: HubDownloadProgress) => void) => () => undefined
  };
}
