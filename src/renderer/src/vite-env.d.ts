/// <reference types="vite/client" />

import type {
  AppInfo,
  AppQueueItem,
  AppStatusMap,
  DiagnosticsReport,
  GithubAsset,
  HubDownloadProgress,
  InstallOptions,
  PreflightResult,
  SourceOverride,
  SourceVerification,
  SystemCheck,
  UpdateCheckResult
} from "../../shared";

declare global {
  type HubStatus = "idle" | "running" | "success" | "error";

  type HubLogEvent = {
    message: string;
    source: "installer" | "tweak" | "system";
    level: "info" | "success" | "warning" | "error";
    timestamp: string;
  };

  interface Window {
    miniHub: {
      installApps: (ids: string[], options?: InstallOptions) => Promise<void>;
      updateInstalledApps: (ids: string[]) => Promise<void>;
      cancelInstall: () => Promise<void>;
      pauseInstall: () => Promise<void>;
      resumeInstall: () => Promise<void>;
      checkApps: (ids: string[]) => Promise<AppStatusMap>;
      runPreflight: (ids: string[]) => Promise<PreflightResult>;
      runSystemChecks: () => Promise<SystemCheck[]>;
      getDownloadsFolder: () => Promise<string>;
      openDownloadsFolder: () => Promise<void>;
      openSource: (id: string) => Promise<void>;
      exportSelection: (ids: string[]) => Promise<boolean>;
      importSelection: () => Promise<string[]>;
      applyTweaks: (ids: string[]) => Promise<void>;
      getStatus: () => Promise<HubStatus>;
      isAdmin: () => Promise<boolean>;
      restartAsAdmin: () => Promise<boolean>;
      getSourceOverrides: () => Promise<SourceOverride[]>;
      saveSourceOverride: (appId: string, url: string) => Promise<SourceOverride>;
      removeSourceOverride: (appId: string) => Promise<boolean>;
      verifySources: (ids: string[]) => Promise<SourceVerification[]>;
      getGithubAssets: (ids: string[]) => Promise<Record<string, GithubAsset[]>>;
      getAppInfo: () => Promise<AppInfo>;
      checkForUpdates: () => Promise<UpdateCheckResult>;
      exportDiagnostics: (report: DiagnosticsReport) => Promise<boolean>;
      getPortableMode: () => Promise<boolean>;
      setPortableMode: (enabled: boolean) => Promise<boolean>;
      minimizeWindow: () => Promise<void>;
      toggleMaximizeWindow: () => Promise<void>;
      closeWindow: () => Promise<void>;
      onLog: (callback: (event: HubLogEvent) => void) => () => void;
      onStatus: (callback: (status: HubStatus) => void) => () => void;
      onQueue: (callback: (items: AppQueueItem[]) => void) => () => void;
      onDownloadProgress: (callback: (progress: HubDownloadProgress) => void) => () => void;
    };
  }
}

export {};
