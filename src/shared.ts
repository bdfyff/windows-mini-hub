export type HubStatus = "idle" | "running" | "success" | "error";
export type AppInstallType = "winget" | "github" | "direct" | "store" | "manual";
export type AppInstallState =
  | "unknown"
  | "installed"
  | "not_installed"
  | "update_available"
  | "source_required"
  | "download_ready"
  | "failed_last_time"
  | "checking";
export type QueueItemStatus = "queued" | "running" | "paused" | "success" | "error" | "skipped" | "cancelled";

export type DetectionRule = {
  registryDisplayName?: string;
  path?: string;
};

export type HubLogEvent = {
  message: string;
  source: "installer" | "tweak" | "system";
  level: "info" | "success" | "warning" | "error";
  timestamp: string;
};

export type HubDownloadProgress = {
  appId: string;
  fileName: string;
  receivedBytes: number;
  totalBytes?: number;
  percent?: number;
  speedBytesPerSecond?: number;
};

export type AppDefinition = {
  id: string;
  name: string;
  category: string;
  description: string;
  installType: AppInstallType;
  wingetId?: string;
  wingetSource?: "winget" | "msstore";
  sourceUrl?: string;
  repo?: string;
  sourceRequired?: boolean;
  detection?: DetectionRule[];
};

export type AppStatusMap = Record<string, AppInstallState>;

export type AppQueueItem = {
  id: string;
  name: string;
  installType: AppInstallType;
  status: QueueItemStatus;
  detail?: string;
};

export type SystemCheck = {
  id: string;
  label: string;
  status: "ok" | "warning" | "error";
  detail: string;
};

export type PreflightCheck = SystemCheck & {
  required?: boolean;
};

export type PreflightResult = {
  canRun: boolean;
  downloadsFolder: string;
  freeSpaceGb: number | null;
  checks: PreflightCheck[];
  appStatuses: AppStatusMap;
};

export type SourceOverride = {
  appId: string;
  url: string;
  updatedAt: string;
};

export type SourceVerification = {
  appId: string;
  installType: AppInstallType;
  domain?: string;
  url?: string;
  repo?: string;
  assetName?: string;
  assetCount?: number;
  warnings: string[];
};

export type GithubAsset = {
  appId: string;
  name: string;
  downloadUrl: string;
  size?: number;
};

export type InstallOptions = {
  githubAssetNames?: Record<string, string>;
};

export type AppProfile = {
  id: string;
  name: string;
  appIds: string[];
  updatedAt: string;
};

export type AppInfo = {
  name: string;
  version: string;
  buildDate: string;
  updateRepo?: string;
};

export type DiagnosticsReport = {
  generatedAt: string;
  app: AppInfo;
  windowsVersion: string;
  isAdmin: boolean;
  wingetVersion: string;
  selectedApps: string[];
  appStatuses: AppStatusMap;
  lastErrors: HubLogEvent[];
};

export type UpdateCheckResult = {
  configured: boolean;
  currentVersion: string;
  latestVersion?: string;
  releaseUrl?: string;
  updateAvailable?: boolean;
  message: string;
};

export type AppPreset = {
  id: string;
  name: string;
  description: string;
  appIds: string[];
};

export type TweakDefinition = {
  id: string;
  name: string;
  description: string;
  command?: string;
  group?: "Safe" | "Balanced" | "Advanced";
  risk?: "low" | "medium" | "high";
  category?: string;
  requiresAdmin?: boolean;
  requiresRestart?: boolean;
  requiresExplorerRestart?: boolean;
  blocked?: boolean;
  blockedReason?: string;
};
