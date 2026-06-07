import type { TweakDefinition } from "./shared";

const explorerAdvanced = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced";
const personalize = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize";
const search = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Search";
const policiesExplorer = "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer";
const desktop = "HKCU:\\Control Panel\\Desktop";

const setDword = (path: string, name: string, value: number) =>
  `New-Item -Path '${path}' -Force | Out-Null; Set-ItemProperty -Path '${path}' -Name ${name} -Type DWord -Value ${value}`;

const setString = (path: string, name: string, value: string) =>
  `New-Item -Path '${path}' -Force | Out-Null; Set-ItemProperty -Path '${path}' -Name ${name} -Type String -Value '${value}'`;

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
    id: "enable-utc-hardware-clock-note",
    name: "Enable UTC hardware clock",
    description: "Optimizer includes global UTC time support. Mini Hub keeps this manual because dual-boot/time setups vary.",
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
    "WinTweaker advertises Defender removal, but Mini Hub does not automate security removal.",
    "System",
    "Disabling or removing security protection can make the PC unsafe."
  ),
  blocked(
    "disable-smartscreen",
    "Disable SmartScreen",
    "WinTweaker advertises SmartScreen removal, but Mini Hub keeps it blocked.",
    "System",
    "SmartScreen protects users from unknown downloads and should not be disabled by a setup hub."
  ),
  blocked(
    "disable-uac",
    "Disable UAC",
    "WinTweaker advertises UAC changes, but Mini Hub does not automate this.",
    "System",
    "Disabling UAC weakens Windows elevation boundaries."
  ),
  blocked(
    "stop-windows-updates",
    "Stop automatic Windows Updates",
    "Optimizer can stop automatic Windows updates. Mini Hub keeps this blocked.",
    "System",
    "Blocking updates can leave the PC without security patches and can break Microsoft Store or driver delivery."
  ),
  blocked(
    "disable-telemetry-services",
    "Disable telemetry services",
    "Optimizer includes telemetry service toggles. Mini Hub does not bulk-disable Windows services.",
    "Services",
    "Service-level changes can break diagnostics, networking, Microsoft Store, updates, battery reports, or app usage tracking."
  ),
  blocked(
    "disable-cortana-system",
    "Disable Cortana system-wide",
    "Optimizer includes Cortana controls. Mini Hub only applies local search/web suggestion tweaks.",
    "Confidentiality",
    "System-wide assistant/search policy changes vary by Windows edition and can break search features."
  ),
  blocked(
    "disable-hpet",
    "Disable HPET",
    "Optimizer includes HPET control for advanced gaming tweaks.",
    "Optimization",
    "Timer tweaks are hardware-dependent and can hurt latency or stability on modern systems."
  ),
  blocked(
    "uninstall-onedrive",
    "Uninstall OneDrive",
    "Optimizer warns that OneDrive removal can delete synced Desktop/Documents data.",
    "Applications",
    "Removing OneDrive is unsafe after Microsoft account sync is configured."
  ),
  blocked(
    "uninstall-uwp-apps",
    "Bulk uninstall UWP apps",
    "Optimizer includes a UWP uninstaller. Mini Hub keeps bulk removal manual.",
    "Applications",
    "Bulk UWP removal can remove dependencies, Store components, or apps the user still needs."
  ),
  blocked(
    "edit-hosts-file",
    "Edit or lock HOSTS file",
    "Optimizer includes HOSTS editing and adblock entries.",
    "Network",
    "HOSTS changes can silently break websites, launchers, updates, or authentication."
  ),
  blocked(
    "change-dns-server",
    "Change DNS server",
    "Optimizer can switch DNS providers. Mini Hub keeps this as a future explicit network tool.",
    "Network",
    "DNS changes should be visible per adapter and reversible, not hidden inside a general tweak preset."
  ),
  blocked(
    "remove-startup-items",
    "Remove startup items",
    "Optimizer includes startup item management. Mini Hub does not delete startup entries as a tweak.",
    "Autorun",
    "Startup cleanup needs a review UI with backup/restore, otherwise it can remove needed tray tools or drivers."
  ),
  blocked(
    "terminate-file-locks",
    "Terminate file lock handles",
    "Optimizer can identify and terminate file lock handles.",
    "System",
    "Force-closing handles can corrupt active files or crash applications."
  ),
  blocked(
    "remove-microsoft-store",
    "Remove Microsoft Store",
    "WinTweaker advertises Store removal, but Mini Hub keeps it manual.",
    "Applications",
    "Removing Store can break app updates, dependencies, and WinGet Store installs."
  ),
  blocked(
    "deep-service-optimizer",
    "Automatic service optimizer",
    "WinTweaker has a service configurator. Mini Hub does not bulk-disable services automatically.",
    "Services",
    "Service presets are hardware and workflow dependent and can break updates, networking, printing, gaming, or login components."
  ),
  blocked(
    "deep-task-scheduler-cleanup",
    "Deep scheduled task cleanup",
    "WinTweaker advertises scheduler cleanup. Mini Hub keeps this blocked.",
    "Confidentiality",
    "Bulk task removal can break Windows maintenance, updates, telemetry controls, and diagnostics."
  ),
  blocked(
    "deep-cache-ai-clean",
    "Deep cache and junk cleanup",
    "WinTweaker advertises deep cache cleanup. Mini Hub does not delete broad system files automatically.",
    "Cleaning",
    "Aggressive cleanup can remove useful caches, logs, installers, restore data, or app state."
  ),
  blocked(
    "duplicate-file-hardlinking",
    "Duplicate replacement with hard links",
    "WinTweaker advertises duplicate replacement using hard links.",
    "Optimization",
    "Automatic duplicate replacement can corrupt user workflows if file identity matters."
  ),
  blocked(
    "autorun-elevated-items",
    "Add elevated autorun items",
    "WinTweaker advertises elevated autorun management.",
    "Autorun",
    "Creating elevated autorun entries is too powerful for a simple setup preset."
  )
];
