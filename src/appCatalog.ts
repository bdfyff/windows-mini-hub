import type { AppDefinition, AppPreset } from "./shared";

export const apps: AppDefinition[] = [
  {
    id: "RARLab.WinRAR",
    name: "WinRAR",
    category: "Архиваторы",
    description: "Архиватор для RAR, ZIP и других форматов.",
    installType: "winget",
    wingetId: "RARLab.WinRAR"
  },
  {
    id: "7zip.7zip",
    name: "7-Zip",
    category: "Архиваторы",
    description: "Бесплатный архиватор с открытым исходным кодом.",
    installType: "winget",
    wingetId: "7zip.7zip"
  },
  {
    id: "Valve.Steam",
    name: "Steam",
    category: "Игры и лаунчеры",
    description: "Игровой лаунчер и магазин.",
    installType: "winget",
    wingetId: "Valve.Steam"
  },
  {
    id: "EpicGames.EpicGamesLauncher",
    name: "Epic Games Launcher",
    category: "Игры и лаунчеры",
    description: "Игровой лаунчер и магазин Epic Games.",
    installType: "winget",
    wingetId: "EpicGames.EpicGamesLauncher"
  },
  {
    id: "ppy.osu",
    name: "osu! lazer",
    category: "Игры и лаунчеры",
    description: "Современная версия ритм-игры osu!.",
    installType: "winget",
    wingetId: "ppy.osu"
  },
  {
    id: "Discord.Discord",
    name: "Discord",
    category: "Общение",
    description: "Мессенджер и голосовая связь.",
    installType: "winget",
    wingetId: "Discord.Discord"
  },
  {
    id: "max-messenger",
    name: "Max",
    category: "Общение",
    description: "Мессенджер. Скачивание по предоставленной ссылке Mail.ru tracking.",
    installType: "direct",
    sourceUrl: "https://trk.mail.ru/c/nm7zj0"
  },
  {
    id: "AyuGram.AyuGramDesktop",
    name: "AyuGram",
    category: "Общение",
    description: "Telegram-клиент из GitHub Releases.",
    installType: "github",
    sourceUrl: "https://github.com/AyuGram/AyuGramDesktop/releases",
    repo: "AyuGram/AyuGramDesktop"
  },
  {
    id: "Flowseal.tg-ws-proxy",
    name: "TGWS Proxy",
    category: "Утилиты",
    description: "Proxy tool из GitHub Releases.",
    installType: "github",
    sourceUrl: "https://github.com/Flowseal/tg-ws-proxy/releases",
    repo: "Flowseal/tg-ws-proxy"
  },
  {
    id: "Flowseal.zapret-discord-youtube",
    name: "Zapret Discord YouTube",
    category: "Утилиты",
    description: "Network utility для Discord и YouTube из GitHub Releases.",
    installType: "github",
    sourceUrl: "https://github.com/Flowseal/zapret-discord-youtube/releases",
    repo: "Flowseal/zapret-discord-youtube"
  },
  {
    id: "Yandex.Browser",
    name: "Yandex Browser",
    category: "Браузеры",
    description: "Браузер Яндекса.",
    installType: "winget",
    wingetId: "Yandex.Browser"
  },
  {
    id: "Google.Chrome",
    name: "Google Chrome",
    category: "Браузеры",
    description: "Браузер Google Chrome.",
    installType: "winget",
    wingetId: "Google.Chrome"
  },
  {
    id: "Mozilla.Firefox",
    name: "Firefox",
    category: "Браузеры",
    description: "Браузер Mozilla Firefox.",
    installType: "winget",
    wingetId: "Mozilla.Firefox"
  },
  {
    id: "AnyDesk.AnyDesk",
    name: "AnyDesk",
    category: "Удалённый доступ",
    description: "Инструмент для удаленного доступа.",
    installType: "winget",
    wingetId: "AnyDesk.AnyDesk"
  },
  {
    id: "Microsoft.PowerToys",
    name: "Microsoft PowerToys",
    category: "Утилиты",
    description: "Набор утилит Microsoft для Windows.",
    installType: "winget",
    wingetId: "Microsoft.PowerToys"
  },
  {
    id: "VideoLAN.VLC",
    name: "VLC Media Player",
    category: "Утилиты",
    description: "Медиаплеер для большинства аудио- и видеоформатов.",
    installType: "winget",
    wingetId: "VideoLAN.VLC"
  },
  {
    id: "Notepad++.Notepad++",
    name: "Notepad++",
    category: "Утилиты",
    description: "Быстрый текстовый редактор для Windows.",
    installType: "winget",
    wingetId: "Notepad++.Notepad++"
  },
  {
    id: "Microsoft.VisualStudioCode",
    name: "Visual Studio Code",
    category: "Утилиты",
    description: "Редактор кода от Microsoft.",
    installType: "winget",
    wingetId: "Microsoft.VisualStudioCode"
  },
  {
    id: "Git.Git",
    name: "Git",
    category: "Утилиты",
    description: "Система контроля версий.",
    installType: "winget",
    wingetId: "Git.Git"
  },
  {
    id: "OpenJS.NodeJS.LTS",
    name: "Node.js LTS",
    category: "Утилиты",
    description: "LTS-версия JavaScript runtime.",
    installType: "winget",
    wingetId: "OpenJS.NodeJS.LTS"
  },
  {
    id: "Python.Python.3.13",
    name: "Python",
    category: "Утилиты",
    description: "Python 3 для разработки и скриптов.",
    installType: "winget",
    wingetId: "Python.Python.3.13"
  },
  {
    id: "Microsoft.DotNet.SDK.10",
    name: ".NET SDK",
    category: "Утилиты",
    description: "SDK для разработки .NET-приложений.",
    installType: "winget",
    wingetId: "Microsoft.DotNet.SDK.10"
  },
  {
    id: "Microsoft.VCRedist.2015+.x64",
    name: "Microsoft Visual C++ Redistributable",
    category: "Утилиты",
    description: "Microsoft Visual C++ 2015-2022 Redistributable для x64.",
    installType: "winget",
    wingetId: "Microsoft.VCRedist.2015+.x64"
  },
  {
    id: "Microsoft.DirectX",
    name: "DirectX Runtime",
    category: "Утилиты",
    description: "DirectX End-User Runtime Installer.",
    installType: "winget",
    wingetId: "Microsoft.DirectX"
  },
  {
    id: "nvidia-app",
    name: "NVIDIA App",
    category: "Утилиты",
    description: "Официальное приложение NVIDIA.",
    installType: "direct",
    sourceUrl: "https://uk.download.nvidia.com/nvapp/client/11.0.7.247/NVIDIA_app_v11.0.7.247.exe"
  },
  {
    id: "throne",
    name: "Throne",
    category: "Утилиты",
    description: "Приложение Throne из GitHub Releases.",
    installType: "github",
    sourceUrl: "https://github.com/throneproj/Throne/releases",
    repo: "throneproj/Throne"
  },
  {
    id: "9PLM9XGG6VKS",
    name: "Codex",
    category: "Утилиты",
    description: "Codex из Microsoft Store.",
    installType: "store",
    wingetId: "9PLM9XGG6VKS",
    wingetSource: "msstore",
    sourceUrl: "https://apps.microsoft.com/detail/9PLM9XGG6VKS"
  },
  {
    id: "darkproject",
    name: "DarkProject",
    category: "Драйверы",
    description: "DarkProject driver для KD83 M3GS Magnetite.",
    installType: "direct",
    sourceUrl: "https://darkproject.ru/upload/iblock/49d/k6zoofokmotwtzelndf2a7vqwmb0lo59/DarkProject_Installer_V2.04.02.zip"
  },
  {
    id: "ajazz-aj179-apex-driver",
    name: "Ajazz Driver AJ179 Apex",
    category: "Драйверы",
    description: "Драйвер/ПО для мыши Ajazz AJ179 Apex.",
    installType: "direct",
    sourceUrl: "http://ajazz.ru/upload/drayvera/AJAZZ_AJ179%20APEX_Tripe%20Mode_Win%20System_Mouse%20Driver.zip"
  }
];

export const presets: AppPreset[] = [
  {
    id: "fresh-base",
    name: "Fresh Windows Pack",
    description: "Базовый набор для новой Windows: архиваторы, браузер, связь, runtime и утилиты.",
    appIds: [
      "7zip.7zip",
      "RARLab.WinRAR",
      "Google.Chrome",
      "Yandex.Browser",
      "Discord.Discord",
      "Microsoft.PowerToys",
      "VideoLAN.VLC",
      "Notepad++.Notepad++",
      "Microsoft.VCRedist.2015+.x64",
      "Microsoft.DirectX"
    ]
  },
  {
    id: "gaming",
    name: "Gaming",
    description: "Лаунчеры, Discord, osu!, runtimes и полезные утилиты.",
    appIds: [
      "Valve.Steam",
      "EpicGames.EpicGamesLauncher",
      "Discord.Discord",
      "ppy.osu",
      "Microsoft.VCRedist.2015+.x64",
      "Microsoft.DirectX",
      "7zip.7zip"
    ]
  },
  {
    id: "developer",
    name: "Developer",
    description: "Редактор, Git, Node.js, Python, .NET SDK и PowerToys.",
    appIds: [
      "Microsoft.VisualStudioCode",
      "Git.Git",
      "OpenJS.NodeJS.LTS",
      "Python.Python.3.13",
      "Microsoft.DotNet.SDK.10",
      "Microsoft.PowerToys",
      "Notepad++.Notepad++"
    ]
  },
  {
    id: "everyday",
    name: "Everyday",
    description: "Браузеры, архиваторы, VLC, AnyDesk и связь.",
    appIds: [
      "Google.Chrome",
      "Mozilla.Firefox",
      "Yandex.Browser",
      "7zip.7zip",
      "RARLab.WinRAR",
      "Discord.Discord",
      "VideoLAN.VLC",
      "AnyDesk.AnyDesk"
    ]
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Только самое необходимое.",
    appIds: ["7zip.7zip", "Google.Chrome", "Microsoft.PowerToys", "Microsoft.VCRedist.2015+.x64"]
  }
];
