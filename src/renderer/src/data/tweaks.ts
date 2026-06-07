import type { TweakDefinition } from "../../../shared";

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
