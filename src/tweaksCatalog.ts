import type { TweakDefinition } from "./shared";

const explorerAdvanced = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced";
const personalize = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize";
const search = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Search";
const policiesExplorer = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer";
const desktop = "HKCU:\\Control Panel\\Desktop";

const setDword = (path: string, name: string, value: number) =>
  `New-Item -Path '${path}' -Force | Out-Null; Set-ItemProperty -Path '${path}' -Name '${name}' -Type DWord -Value ${value}`;

const setString = (path: string, name: string, value: string) =>
  `New-Item -Path '${path}' -Force | Out-Null; Set-ItemProperty -Path '${path}' -Name '${name}' -Type String -Value '${value}'`;

const blocked = (
  id: string,
  name: string,
  description: string,
  category: string,
  blockedReason: string
): TweakDefinition => ({
  id,
  name,
  description,
  category,
  group: "Advanced",
  risk: "high",
  blocked: true,
  blockedReason
});

export const tweaks: TweakDefinition[] = [
  {
    id: "show-file-extensions",
    name: "Show file extensions",
    description: "Show extensions for known file types in File Explorer.",
    category: "Interface",
    group: "Safe",
    risk: "low",
    command: setDword(explorerAdvanced, "HideFileExt", 0),
    requiresExplorerRestart: true
  },
  {
    id: "show-hidden-files",
    name: "Show hidden files",
    description: "Show hidden files and folders in File Explorer.",
    category: "Interface",
    group: "Balanced",
    risk: "medium",
    command: setDword(explorerAdvanced, "Hidden", 1),
    requiresExplorerRestart: true
  },
  {
    id: "show-protected-system-files-warning",
    name: "Keep protected system files hidden",
    description: "Keeps protected OS files hidden while still allowing normal hidden files to be shown.",
    category: "Interface",
    group: "Safe",
    risk: "low",
    command: setDword(explorerAdvanced, "ShowSuperHidden", 0),
    requiresExplorerRestart: true
  },
  {
    id: "enable-dark-mode",
    name: "Enable dark mode",
    description: "Use dark theme for Windows apps and system surfaces.",
    category: "Interface",
    group: "Safe",
    risk: "low",
    command: `${setDword(personalize, "AppsUseLightTheme", 0)}; ${setDword(personalize, "SystemUsesLightTheme", 0)}`
  },
  {
    id: "disable-transparency-effects",
    name: "Disable transparency effects",
    description: "Turns off Windows transparency effects for a cleaner and slightly lighter UI.",
    category: "Interface",
    group: "Safe",
    risk: "low",
    command: setDword(personalize, "EnableTransparency", 0)
  },
  {
    id: "taskbar-align-left",
    name: "Align taskbar to the left",
    description: "Moves Windows 11 taskbar icons to the left.",
    category: "Interface",
    group: "Safe",
    risk: "low",
    command: setDword(explorerAdvanced, "TaskbarAl", 0),
    requiresExplorerRestart: true
  },
  {
    id: "show-seconds-clock",
    name: "Show seconds in taskbar clock",
    description: "Shows seconds in the system tray clock when supported by Windows.",
    category: "Interface",
    group: "Safe",
    risk: "low",
    command: setDword(explorerAdvanced, "ShowSecondsInSystemClock", 1),
    requiresExplorerRestart: true
  },
  {
    id: "open-explorer-this-pc",
    name: "Open Explorer to This PC",
    description: "Makes File Explorer open This PC instead of Quick Access.",
    category: "Interface",
    group: "Safe",
    risk: "low",
    command: setDword(explorerAdvanced, "LaunchTo", 1),
    requiresExplorerRestart: true
  },
  {
    id: "classic-context-menu",
    name: "Classic full context menu",
    description: "Restores the classic full right-click context menu on Windows 11.",
    category: "Context Menu",
    group: "Balanced",
    risk: "medium",
    command:
      "New-Item -Path 'HKCU:\\Software\\Classes\\CLSID\\{86ca1aa0-34aa-4e8b-a509-50c905bae2a2}\\InprocServer32' -Force | Out-Null; Set-ItemProperty -Path 'HKCU:\\Software\\Classes\\CLSID\\{86ca1aa0-34aa-4e8b-a509-50c905bae2a2}\\InprocServer32' -Name '(default)' -Value ''",
    requiresExplorerRestart: true
  },
  {
    id: "disable-bing-search",
    name: "Disable Bing results in Windows Search",
    description: "Keeps Start/Search focused on local results instead of web suggestions.",
    category: "Confidentiality",
    group: "Balanced",
    risk: "medium",
    command: `${setDword(search, "BingSearchEnabled", 0)}; ${setDword(search, "CortanaConsent", 0)}`
  },
  {
    id: "disable-search-highlights",
    name: "Disable search highlights",
    description: "Removes rotating web content from the Windows search panel.",
    category: "Confidentiality",
    group: "Balanced",
    risk: "medium",
    command: setDword(search, "SearchboxTaskbarMode", 1)
  },
  {
    id: "disable-advertising-id",
    name: "Disable advertising ID",
    description: "Disables the per-user Windows advertising ID.",
    category: "Confidentiality",
    group: "Safe",
    risk: "low",
    command: setDword("HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\AdvertisingInfo", "Enabled", 0)
  },
  {
    id: "disable-tailored-experiences",
    name: "Disable tailored experiences",
    description: "Turns off diagnostic-data-based tips and recommendations for the current user.",
    category: "Confidentiality",
    group: "Safe",
    risk: "low",
    command: setDword("HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Privacy", "TailoredExperiencesWithDiagnosticDataEnabled", 0)
  },
  {
    id: "disable-windows-tips",
    name: "Disable Windows tips and suggestions",
    description: "Reduces suggested content, welcome tips, and settings suggestions.",
    category: "Confidentiality",
    group: "Safe",
    risk: "low",
    command: [
      setDword("HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager", "SubscribedContent-338389Enabled", 0),
      setDword("HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager", "SubscribedContent-338393Enabled", 0),
      setDword("HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager", "SubscribedContent-353694Enabled", 0),
      setDword("HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager", "SubscribedContent-353696Enabled", 0)
    ].join("; ")
  },
  {
    id: "disable-lock-screen-facts",
    name: "Disable lock screen facts",
    description: "Removes tips, fun facts, and suggestions from the lock screen.",
    category: "Confidentiality",
    group: "Safe",
    risk: "low",
    command: setDword("HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager", "RotatingLockScreenOverlayEnabled", 0)
  },
  {
    id: "enable-clipboard-history",
    name: "Enable clipboard history",
    description: "Turn on Windows clipboard history.",
    category: "System",
    group: "Balanced",
    risk: "medium",
    command: setDword("HKCU:\\Software\\Microsoft\\Clipboard", "EnableClipboardHistory", 1)
  },
  {
    id: "disable-autoplay",
    name: "Disable AutoPlay",
    description: "Prevents Windows from automatically opening actions for newly inserted media.",
    category: "System",
    group: "Balanced",
    risk: "medium",
    command: `${setDword(policiesExplorer, "NoDriveTypeAutoRun", 255)}; ${setDword("HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\AutoplayHandlers", "DisableAutoplay", 1)}`
  },
  {
    id: "disable-startup-app-notification",
    name: "Disable startup app notifications",
    description: "Disables notifications when new startup apps are registered.",
    category: "Autorun",
    group: "Safe",
    risk: "low",
    command: setDword("HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Notifications\\Settings\\Windows.SystemToast.StartupApp", "Enabled", 0)
  },
  {
    id: "disable-recent-documents",
    name: "Disable recent documents history",
    description: "Stops Windows from tracking recently opened documents for the current user.",
    category: "System",
    group: "Balanced",
    risk: "medium",
    command: `${setDword(policiesExplorer, "NoRecentDocsHistory", 1)}; ${setDword(policiesExplorer, "NoRecentDocsMenu", 1)}`,
    requiresExplorerRestart: true
  },
  {
    id: "menu-show-delay-fast",
    name: "Make menus open faster",
    description: "Reduces the current-user menu animation delay.",
    category: "Optimization",
    group: "Safe",
    risk: "low",
    command: setString(desktop, "MenuShowDelay", "100"),
    requiresRestart: true
  },
  {
    id: "disable-shake-minimize",
    name: "Disable Aero Shake",
    description: "Prevents accidental minimization of other windows when shaking a window.",
    category: "Interface",
    group: "Safe",
    risk: "low",
    command: setDword("HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced", "DisallowShaking", 1)
  },
  {
    id: "disable-widgets",
    name: "Hide Widgets button",
    description: "Hides the Windows Widgets taskbar button for the current user.",
    category: "Interface",
    group: "Balanced",
    risk: "medium",
    command: setDword(explorerAdvanced, "TaskbarDa", 0),
    requiresExplorerRestart: true
  },
  {
    id: "disable-chat-taskbar",
    name: "Hide Chat/Teams taskbar button",
    description: "Hides the consumer Chat/Teams taskbar button where supported.",
    category: "Interface",
    group: "Balanced",
    risk: "medium",
    command: setDword("HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced", "TaskbarMn", 0),
    requiresExplorerRestart: true
  },
  {
    id: "disable-copilot-current-user",
    name: "Disable Copilot for current user",
    description: "Adds current-user policy values to hide/disable Windows Copilot surfaces where supported.",
    category: "Confidentiality",
    group: "Balanced",
    risk: "medium",
    command: `${setDword("HKCU:\\Software\\Policies\\Microsoft\\Windows\\WindowsCopilot", "TurnOffWindowsCopilot", 1)}; ${setDword("HKCU:\\Software\\Policies\\Microsoft\\Edge", "HubsSidebarEnabled", 0)}`,
    requiresExplorerRestart: true
  },
  {
    id: "disable-consumer-features",
    name: "Disable Windows consumer suggestions",
    description: "Reduces consumer app suggestions and promotional Windows content for the current user.",
    category: "Confidentiality",
    group: "Balanced",
    risk: "medium",
    command: setDword("HKCU:\\Software\\Policies\\Microsoft\\Windows\\CloudContent", "DisableWindowsConsumerFeatures", 1)
  },
  {
    id: "disable-cloud-content-suggestions",
    name: "Disable cloud content suggestions",
    description: "Turns off cloud-delivered suggestion content in Windows surfaces where supported.",
    category: "Confidentiality",
    group: "Balanced",
    risk: "medium",
    command: `${setDword("HKCU:\\Software\\Policies\\Microsoft\\Windows\\CloudContent", "DisableCloudOptimizedContent", 1)}; ${setDword("HKCU:\\Software\\Policies\\Microsoft\\Windows\\CloudContent", "DisableSoftLanding", 1)}`
  },
  {
    id: "disable-office-telemetry-user",
    name: "Disable Office telemetry for current user",
    description: "Adds Office current-user policy values that reduce telemetry for Office 2016 or newer.",
    category: "Confidentiality",
    group: "Balanced",
    risk: "medium",
    command: `${setDword("HKCU:\\Software\\Policies\\Microsoft\\Office\\16.0\\Common\\ClientTelemetry", "DisableTelemetry", 1)}; ${setDword("HKCU:\\Software\\Policies\\Microsoft\\Office\\16.0\\Common\\ClientTelemetry", "SendTelemetry", 3)}`
  },
  {
    id: "disable-chrome-telemetry-user",
    name: "Disable Chrome telemetry policies",
    description: "Sets current-user Chrome policies for metrics reporting and cleanup reporting.",
    category: "Confidentiality",
    group: "Balanced",
    risk: "medium",
    command: `${setDword("HKCU:\\Software\\Policies\\Google\\Chrome", "MetricsReportingEnabled", 0)}; ${setDword("HKCU:\\Software\\Policies\\Google\\Chrome", "ChromeCleanupEnabled", 0)}; ${setDword("HKCU:\\Software\\Policies\\Google\\Chrome", "ChromeCleanupReportingEnabled", 0)}`
  },
  {
    id: "disable-firefox-telemetry-user",
    name: "Disable Firefox telemetry policy",
    description: "Sets current-user Firefox policy to disable telemetry where enterprise policies are respected.",
    category: "Confidentiality",
    group: "Balanced",
    risk: "medium",
    command: setDword("HKCU:\\Software\\Policies\\Mozilla\\Firefox", "DisableTelemetry", 1)
  },
  {
    id: "disable-edge-spotlight-suggestions",
    name: "Reduce Edge suggestions",
    description: "Adds current-user Edge policies for reduced sidebar and recommendation surfaces without disabling SmartScreen.",
    category: "Confidentiality",
    group: "Balanced",
    risk: "medium",
    command: `${setDword("HKCU:\\Software\\Policies\\Microsoft\\Edge", "ShowRecommendationsEnabled", 0)}; ${setDword("HKCU:\\Software\\Policies\\Microsoft\\Edge", "PersonalizationReportingEnabled", 0)}; ${setDword("HKCU:\\Software\\Policies\\Microsoft\\Edge", "UserFeedbackAllowed", 0)}`
  },
  {
    id: "flush-dns-cache",
    name: "Flush DNS cache",
    description: "Clears the Windows DNS resolver cache. Internet may briefly reconnect.",
    category: "Network",
    group: "Safe",
    risk: "low",
    command: "Clear-DnsClientCache"
  },
  {
    id: "show-this-pc-desktop",
    name: "Show This PC on desktop",
    description: "Shows the This PC icon on the desktop for the current user.",
    category: "Personalization",
    group: "Safe",
    risk: "low",
    command: setDword("HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\HideDesktopIcons\\NewStartPanel", "{20D04FE0-3AEA-1069-A2D8-08002B30309D}", 0),
    requiresExplorerRestart: true
  },
  {
    id: "show-item-check-boxes",
    name: "Show item check boxes",
    description: "Enables File Explorer item check boxes for easier selection.",
    category: "Personalization",
    group: "Safe",
    risk: "low",
    command: setDword(explorerAdvanced, "AutoCheckSelect", 1),
    requiresExplorerRestart: true
  },
  {
    id: "show-merge-conflicts",
    name: "Show folder merge conflicts",
    description: "Shows confirmation prompts when folder merge conflicts occur.",
    category: "Personalization",
    group: "Safe",
    risk: "low",
    command: setDword(explorerAdvanced, "HideMergeConflicts", 0),
    requiresExplorerRestart: true
  },
  {
    id: "enable-explorer-compact-mode",
    name: "Enable File Explorer compact mode",
    description: "Reduces vertical spacing in File Explorer on Windows 11.",
    category: "Personalization",
    group: "Safe",
    risk: "low",
    command: setDword(explorerAdvanced, "UseCompactMode", 1),
    requiresExplorerRestart: true
  },
  {
    id: "disable-explorer-sync-provider-ads",
    name: "Disable Explorer sync provider ads",
    description: "Hides OneDrive/provider notification ads in File Explorer.",
    category: "Personalization",
    group: "Safe",
    risk: "low",
    command: setDword(explorerAdvanced, "ShowSyncProviderNotifications", 0),
    requiresExplorerRestart: true
  },
  {
    id: "disable-snap-assist-suggestions",
    name: "Disable Snap Assist suggestions",
    description: "Disables suggested windows after snapping a window.",
    category: "Personalization",
    group: "Safe",
    risk: "low",
    command: setDword(explorerAdvanced, "SnapAssist", 0)
  },
  {
    id: "enable-recycle-delete-confirmation",
    name: "Enable Recycle Bin delete confirmation",
    description: "Shows a confirmation dialog before deleting files to the Recycle Bin.",
    category: "Personalization",
    group: "Safe",
    risk: "low",
    command: setDword("HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer", "ConfirmFileDelete", 1)
  },
  {
    id: "hide-quick-access-recent-files",
    name: "Hide recent files in Quick Access",
    description: "Stops File Explorer from showing recent files in Quick Access.",
    category: "Privacy",
    group: "Balanced",
    risk: "medium",
    command: setDword("HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer", "ShowRecent", 0),
    requiresExplorerRestart: true
  },
  {
    id: "hide-quick-access-frequent-folders",
    name: "Hide frequent folders in Quick Access",
    description: "Stops File Explorer from showing frequent folders in Quick Access.",
    category: "Privacy",
    group: "Balanced",
    risk: "medium",
    command: setDword("HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer", "ShowFrequent", 0),
    requiresExplorerRestart: true
  },
  {
    id: "hide-taskbar-search",
    name: "Hide taskbar search",
    description: "Hides the taskbar search box/button for a cleaner taskbar.",
    category: "Personalization",
    group: "Safe",
    risk: "low",
    command: setDword(search, "SearchboxTaskbarMode", 0),
    requiresExplorerRestart: true
  },
  {
    id: "hide-task-view-button",
    name: "Hide Task View button",
    description: "Hides the Task View button from the taskbar.",
    category: "Personalization",
    group: "Safe",
    risk: "low",
    command: setDword(explorerAdvanced, "ShowTaskViewButton", 0),
    requiresExplorerRestart: true
  },
  {
    id: "disable-start-recently-added",
    name: "Hide recently added apps on Start",
    description: "Disables the recently added apps section in Start.",
    category: "Start Menu",
    group: "Safe",
    risk: "low",
    command: setDword(explorerAdvanced, "Start_TrackProgs", 0),
    requiresExplorerRestart: true
  },
  {
    id: "disable-start-most-used",
    name: "Hide most used Start apps",
    description: "Disables most-used app tracking in Start for the current user.",
    category: "Start Menu",
    group: "Balanced",
    risk: "medium",
    command: setDword(explorerAdvanced, "Start_TrackDocs", 0),
    requiresExplorerRestart: true
  },
  {
    id: "disable-start-recommendations",
    name: "Hide Start recommendations",
    description: "Disables Windows 11 Start recommendations where supported.",
    category: "Start Menu",
    group: "Balanced",
    risk: "medium",
    command: setDword(explorerAdvanced, "Start_IrisRecommendations", 0),
    requiresExplorerRestart: true
  },
  {
    id: "disable-start-account-notifications",
    name: "Hide Start account notifications",
    description: "Disables Microsoft account-related notifications in Start where supported.",
    category: "Start Menu",
    group: "Balanced",
    risk: "medium",
    command: setDword(explorerAdvanced, "Start_AccountNotifications", 0),
    requiresExplorerRestart: true
  },
  {
    id: "disable-welcome-experience",
    name: "Disable Windows welcome experience",
    description: "Stops the post-update welcome and tips experience for the current user.",
    category: "Privacy",
    group: "Safe",
    risk: "low",
    command: setDword("HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager", "SubscribedContent-310093Enabled", 0)
  },
  {
    id: "disable-silent-app-installing",
    name: "Disable silent suggested app installs",
    description: "Prevents Windows from silently installing suggested consumer apps for the current user.",
    category: "Privacy",
    group: "Balanced",
    risk: "medium",
    command: setDword("HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager", "SilentInstalledAppsEnabled", 0)
  },
  {
    id: "disable-settings-suggested-content",
    name: "Disable Settings suggested content",
    description: "Turns off suggested content cards inside Windows Settings.",
    category: "Privacy",
    group: "Safe",
    risk: "low",
    command: [
      setDword("HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager", "SubscribedContent-338393Enabled", 0),
      setDword("HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager", "SubscribedContent-353694Enabled", 0),
      setDword("HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager", "SubscribedContent-353696Enabled", 0)
    ].join("; ")
  },
  {
    id: "enable-prtscn-snipping-tool",
    name: "Use Print Screen for Snipping Tool",
    description: "Opens screen snipping when pressing Print Screen.",
    category: "Personalization",
    group: "Safe",
    risk: "low",
    command: setDword("HKCU:\\Control Panel\\Keyboard", "PrintScreenKeyForSnippingEnabled", 1)
  },
  {
    id: "disable-shortcut-suffix",
    name: "Remove '- Shortcut' suffix",
    description: "Stops Windows from adding the '- Shortcut' suffix to newly created shortcuts.",
    category: "Personalization",
    group: "Safe",
    risk: "low",
    command: "New-Item -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer' -Force | Out-Null; Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer' -Name link -Type Binary -Value ([byte[]](0,0,0,0))",
    requiresExplorerRestart: true
  },
  {
    id: "set-jpeg-wallpaper-quality-100",
    name: "Set JPEG wallpaper quality to 100%",
    description: "Prevents Windows from recompressing JPEG wallpapers too aggressively.",
    category: "Personalization",
    group: "Safe",
    risk: "low",
    command: setDword(desktop, "JPEGImportQuality", 100)
  },
  {
    id: "windows-manage-default-printer-off",
    name: "Stop Windows managing default printer",
    description: "Keeps your chosen default printer instead of changing it based on location.",
    category: "System",
    group: "Safe",
    risk: "low",
    command: setDword("HKCU:\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Windows", "LegacyDefaultPrinterMode", 1)
  },
  {
    id: "enable-numlock-on-startup",
    name: "Enable NumLock on startup",
    description: "Requests NumLock enabled for the current user at sign-in.",
    category: "System",
    group: "Safe",
    risk: "low",
    command: setString("HKCU:\\Control Panel\\Keyboard", "InitialKeyboardIndicators", "2"),
    requiresRestart: true
  },
  {
    id: "restore-previous-folder-windows",
    name: "Restore previous folder windows",
    description: "Reopens File Explorer windows from the previous session after sign-in.",
    category: "System",
    group: "Safe",
    risk: "low",
    command: setDword(explorerAdvanced, "PersistBrowsers", 1),
    requiresRestart: true
  },
  {
    id: "restart-apps-after-sign-in",
    name: "Restart apps after sign-in",
    description: "Allows Windows to save restartable apps and restore them after sign-in.",
    category: "System",
    group: "Safe",
    risk: "low",
    command: setDword("HKCU:\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon", "RestartApps", 1)
  },
  {
    id: "disable-sticky-keys-shortcut",
    name: "Disable Sticky Keys shortcut prompt",
    description: "Prevents the five-times-Shift shortcut prompt from interrupting games.",
    category: "Gaming",
    group: "Balanced",
    risk: "medium",
    command: `${setString("HKCU:\\Control Panel\\Accessibility\\StickyKeys", "Flags", "506")}; ${setString("HKCU:\\Control Panel\\Accessibility\\Keyboard Response", "Flags", "122")}; ${setString("HKCU:\\Control Panel\\Accessibility\\ToggleKeys", "Flags", "58")}`
  },
  {
    id: "disable-xbox-game-tips",
    name: "Disable Xbox Game Bar tips",
    description: "Disables Game DVR/game bar tips for the current user.",
    category: "Gaming",
    group: "Balanced",
    risk: "medium",
    command: `${setDword("HKCU:\\Software\\Microsoft\\GameBar", "ShowStartupPanel", 0)}; ${setDword("HKCU:\\Software\\Microsoft\\GameBar", "UseNexusForGameBarEnabled", 0)}`
  },
  {
    id: "enable-utc-hardware-clock-note",
    name: "Enable UTC hardware clock",
    description: "Keeps this manual because dual-boot and system time setups vary.",
    category: "System",
    group: "Advanced",
    risk: "high",
    blocked: true,
    blockedReason: "This changes system time behavior and can confuse Windows/Linux dual-boot setups if applied blindly."
  },
  {
    id: "enable-long-paths-user-note",
    name: "Long paths support note",
    description: "This tweak requires machine-level policy and is intentionally not applied without admin review.",
    category: "System",
    group: "Advanced",
    risk: "high",
    blocked: true,
    blockedReason: "Requires HKLM policy changes. Mini Hub keeps this manual until an admin-safe flow is added."
  },
  blocked(
    "remove-defender",
    "Remove or disable Microsoft Defender",
    "Security protection removal is available for review only and is not automated.",
    "System",
    "Disabling or removing security protection can make the PC unsafe."
  ),
  blocked(
    "set-diagnostic-data-minimum",
    "Set diagnostic data to minimum",
    "Configures Windows diagnostic data levels.",
    "Privacy",
    "This is a machine-level policy and should be implemented with a clear admin-only Windows edition check."
  ),
  blocked(
    "disable-error-reporting",
    "Disable Windows Error Reporting",
    "Configures Windows Error Reporting.",
    "Privacy",
    "Disabling WER can hide useful crash diagnostics and requires service/task handling."
  ),
  blocked(
    "disable-feedback-frequency",
    "Disable feedback frequency prompts",
    "Configures Windows feedback prompt controls.",
    "Privacy",
    "This should be bundled into a reversible privacy preset with state detection."
  ),
  blocked(
    "disable-activity-history",
    "Disable activity history and timeline",
    "Configures activity history and timeline privacy.",
    "Privacy",
    "Activity history differs across Windows builds; add detection before applying."
  ),
  blocked(
    "enable-storage-sense",
    "Enable Storage Sense",
    "Configures Storage Sense cleanup behavior.",
    "System",
    "Storage cleanup needs visible retention settings so user files are not removed unexpectedly."
  ),
  blocked(
    "disable-hibernation",
    "Disable hibernation",
    "Configures Windows hibernation.",
    "System",
    "This can disable Fast Startup and affects laptops; it should be an explicit power setting."
  ),
  blocked(
    "configure-delivery-optimization",
    "Configure Delivery Optimization",
    "Configures Windows Update Delivery Optimization.",
    "System",
    "Network/update sharing policy should be shown as a dedicated Windows Update setting."
  ),
  blocked(
    "configure-active-hours",
    "Configure Windows Update active hours",
    "Configures Windows Update active hours.",
    "System",
    "This needs time inputs instead of a one-click tweak."
  ),
  blocked(
    "configure-power-plan",
    "Configure power plan",
    "Switches Windows power plans.",
    "System",
    "Power plans are hardware and laptop/desktop dependent."
  ),
  blocked(
    "disable-network-adapter-power-save",
    "Disable network adapter power saving",
    "Configures network adapter power saving.",
    "Network",
    "This must enumerate adapters and show exactly what will change."
  ),
  blocked(
    "create-windows-cleanup-task",
    "Create Windows Cleanup scheduled task",
    "Creates scheduled cleanup tasks with notifications.",
    "Cleaning",
    "Scheduled cleanup needs a dedicated UI for frequency, scope, and undo."
  ),
  blocked(
    "cleanup-softwaredistribution-task",
    "Create SoftwareDistribution cleanup task",
    "Schedules Windows Update cache cleanup.",
    "Cleaning",
    "Windows Update cache cleanup should wait for update state and be run as a dedicated maintenance action."
  ),
  blocked(
    "cleanup-temp-task",
    "Create TEMP cleanup task",
    "Schedules TEMP folder cleanup.",
    "Cleaning",
    "Scheduled deletion should expose retention rules and affected folders first."
  ),
  blocked(
    "enable-defender-network-protection",
    "Enable Defender network protection",
    "Configures Microsoft Defender hardening.",
    "Security",
    "Security hardening is useful, but needs admin checks, Defender health checks, and a dedicated security page."
  ),
  blocked(
    "enable-defender-pua-detection",
    "Enable Defender PUA detection",
    "Enables potentially unwanted app blocking.",
    "Security",
    "This should be an admin-only security preset with clear compatibility notes."
  ),
  blocked(
    "enable-defender-sandbox",
    "Enable Defender sandbox",
    "Configures Defender sandboxing.",
    "Security",
    "This is security-positive, but should be applied only after Defender health/admin checks."
  ),
  blocked(
    "enable-lsa-protection",
    "Enable LSA protection",
    "Enables Local Security Authority protection.",
    "Security",
    "LSA protection may require reboot and can trigger compatibility issues with credential tools."
  ),
  blocked(
    "enable-powershell-logging",
    "Enable PowerShell logging",
    "Configures PowerShell module and script logging.",
    "Security",
    "Logging policy belongs in an admin security/audit preset with storage and privacy notes."
  ),
  blocked(
    "enable-windows-sandbox",
    "Enable Windows Sandbox",
    "Enables Windows Sandbox.",
    "Security",
    "This requires Windows feature management, edition checks, virtualization checks, and reboot handling."
  ),
  blocked(
    "remove-windows-ai-recall",
    "Remove Windows AI / Recall surfaces",
    "Controls Windows AI and Recall surfaces.",
    "Privacy",
    "Windows AI features vary by build and hardware; this needs build-specific detection before automation."
  ),
  blocked(
    "disable-smartscreen",
    "Disable SmartScreen",
    "SmartScreen removal is available for review only and is not automated.",
    "System",
    "SmartScreen protects users from unknown downloads and should not be disabled by a setup hub."
  ),
  blocked(
    "disable-uac",
    "Disable UAC",
    "UAC removal is available for review only and is not automated.",
    "System",
    "Disabling UAC weakens Windows elevation boundaries."
  ),
  blocked(
    "stop-windows-updates",
    "Stop automatic Windows Updates",
    "Stops automatic Windows updates.",
    "System",
    "Blocking updates can leave the PC without security patches and can break Microsoft Store or driver delivery."
  ),
  blocked(
    "disable-telemetry-services",
    "Disable telemetry services",
    "Disables telemetry-related Windows services.",
    "Services",
    "Service-level changes can break diagnostics, networking, Microsoft Store, updates, battery reports, or app usage tracking."
  ),
  blocked(
    "disable-cortana-system",
    "Disable Cortana system-wide",
    "Disables Cortana system-wide.",
    "Confidentiality",
    "System-wide assistant/search policy changes vary by Windows edition and can break search features."
  ),
  blocked(
    "disable-hpet",
    "Disable HPET",
    "Configures HPET for advanced gaming timer tuning.",
    "Optimization",
    "Timer tweaks are hardware-dependent and can hurt latency or stability on modern systems."
  ),
  blocked(
    "uninstall-onedrive",
    "Uninstall OneDrive",
    "Removes OneDrive integration and related components.",
    "Applications",
    "Removing OneDrive is unsafe after Microsoft account sync is configured."
  ),
  blocked(
    "uninstall-uwp-apps",
    "Bulk uninstall UWP apps",
    "Bulk-removes selected UWP apps.",
    "Applications",
    "Bulk UWP removal can remove dependencies, Store components, or apps the user still needs."
  ),
  blocked(
    "edit-hosts-file",
    "Edit or lock HOSTS file",
    "Edits or locks the HOSTS file.",
    "Network",
    "HOSTS changes can silently break websites, launchers, updates, or authentication."
  ),
  blocked(
    "change-dns-server",
    "Change DNS server",
    "Changes DNS providers for selected network adapters.",
    "Network",
    "DNS changes should be visible per adapter and reversible, not hidden inside a general tweak preset."
  ),
  blocked(
    "remove-startup-items",
    "Remove startup items",
    "Removes startup entries.",
    "Autorun",
    "Startup cleanup needs a review UI with backup/restore, otherwise it can remove needed tray tools or drivers."
  ),
  blocked(
    "terminate-file-locks",
    "Terminate file lock handles",
    "Identifies and terminates file lock handles.",
    "System",
    "Force-closing handles can corrupt active files or crash applications."
  ),
  blocked(
    "remove-microsoft-store",
    "Remove Microsoft Store",
    "Removes Microsoft Store.",
    "Applications",
    "Removing Store can break app updates, dependencies, and WinGet Store installs."
  ),
  blocked(
    "deep-service-optimizer",
    "Automatic service optimizer",
    "Bulk-configures Windows services.",
    "Services",
    "Service presets are hardware and workflow dependent and can break updates, networking, printing, gaming, or login components."
  ),
  blocked(
    "deep-task-scheduler-cleanup",
    "Deep scheduled task cleanup",
    "Bulk-cleans scheduled tasks.",
    "Confidentiality",
    "Bulk task removal can break Windows maintenance, updates, telemetry controls, and diagnostics."
  ),
  blocked(
    "deep-cache-ai-clean",
    "Deep cache and junk cleanup",
    "Runs deep system cache and junk cleanup.",
    "Cleaning",
    "Aggressive cleanup can remove useful caches, logs, installers, restore data, or app state."
  ),
  blocked(
    "duplicate-file-hardlinking",
    "Duplicate replacement with hard links",
    "Replaces duplicate files using hard links.",
    "Optimization",
    "Automatic duplicate replacement can corrupt user workflows if file identity matters."
  ),
  blocked(
    "autorun-elevated-items",
    "Add elevated autorun items",
    "Adds elevated autorun entries.",
    "Autorun",
    "Creating elevated autorun entries is too powerful for a simple setup preset."
  )
];
