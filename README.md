<p align="center">
  <img src="build/icon.png" width="128" alt="Windows Mini Hub icon" />
</p>

<h1 align="center">Windows Mini Hub</h1>

<p align="center">
  A modern desktop setup hub for fresh Windows installs.
  <br />
  Pick apps, install with WinGet, download trusted installers, apply safe tweaks, and watch everything in live logs.
</p>

<p align="center">
  <img alt="Electron" src="https://img.shields.io/badge/Electron-42-7dd3fc?style=for-the-badge&logo=electron&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=0f172a" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind-CSS-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img alt="Windows" src="https://img.shields.io/badge/Windows-Setup%20Hub-0078d4?style=for-the-badge&logo=windows11&logoColor=white" />
</p>

---

## Preview

Windows Mini Hub is designed like a clean desktop dashboard: dark-first, glass UI, sidebar navigation, installer queue, floating logs, and scan-based recommendations.

> Screenshots can be added here after the first GitHub release.

```text
Dashboard  -> fresh setup overview, smart recommendations, installed scan
Apps       -> app catalog, filters, profiles, preflight, install queue
Tweaks     -> safe Windows tweaks with confirmation
Logs       -> terminal-style live output
Sources    -> official/manual URL editor
Settings   -> theme, portable mode, diagnostics, admin restart, release info
```

## Highlights

- **Fresh Windows cockpit**: install the basic apps and runtimes you need after a clean Windows setup.
- **Safe Electron architecture**: renderer has no direct Node.js access; commands run only in the main process.
- **WinGet-first installs**: install known packages through `winget install --id <id> -e`.
- **GitHub Releases support**: fetch latest release assets for supported apps.
- **Direct downloads**: download official `.exe`, `.msi`, and `.zip` installers into `Downloads/Windows Mini Hub`.
- **Live installer logs**: see task progress, errors, timestamps, and terminal-style output.
- **Installed app scan**: detect installed apps like VLC, Chrome, Git, Steam, Discord, and more.
- **Smart recommendations**: see what is already installed and what is missing for Fresh/Gaming/Developer setups.
- **Profiles**: save reusable app selections like Gaming, Developer, Clean Windows, or My setup.
- **Update mode**: run `winget upgrade` for installed apps.
- **Safe Windows tweaks**: apply user-level tweaks like file extensions, dark mode, clipboard history, and hidden files.
- **Diagnostics export**: export useful debug info for troubleshooting.
- **Portable mode**: optionally store config data next to the executable.
- **Release-ready packaging**: GitHub Actions workflow and electron-builder publish config included.

## App Sources

Windows Mini Hub supports several source types:

| Source | Behavior |
| --- | --- |
| `winget` | Installs via WinGet package id |
| `store` | Installs Microsoft Store apps via WinGet |
| `github` | Downloads selected latest release asset |
| `direct` | Downloads official direct URL |
| `manual` | Requires official source before automatic install |

Manual/source-required apps are never installed automatically until a trusted source is configured.

## Safety Model

Windows Mini Hub is intentionally built with a narrow command surface.

- React UI does **not** have direct Node.js access.
- Commands run only in Electron main process.
- Renderer sends only allowlisted `appId` or `tweakId`.
- Main process resolves commands and URLs from local config.
- Manual apps require explicit official source configuration.
- No aggressive debloat or security-disabling tweaks are included.

## Tech Stack

- Electron
- React
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui-style local components
- Node.js `child_process`
- WinGet
- PowerShell
- electron-builder

## Project Structure

```text
src/
  main/
    index.ts
    installers.ts
    tweaks.ts
  preload/
    index.ts
  renderer/
    src/
      App.tsx
      assets/
      components/
      pages/
        AppsPage.tsx
        DashboardPage.tsx
        LogsPage.tsx
        ManualPage.tsx
        SettingsPage.tsx
        TweaksPage.tsx
      data/
        apps.ts
        presets.ts
        tweaks.ts
```

## Local Development

```bash
npm install
npm run dev
```

## Build Locally

```bash
npm run build
npm run dist
```

Build outputs are written to `release/`.

Expected Windows artifacts:

```text
Windows Mini Hub-Portable-0.1.0-x64.exe
Windows Mini Hub-Setup-0.1.0-x64.exe
latest.yml
```

## GitHub Repository

Repository:

[github.com/bdfyff/windows-mini-hub](https://github.com/bdfyff/windows-mini-hub)

The app is already configured for this GitHub repo:

```json
"repository": {
  "type": "git",
  "url": "https://github.com/bdfyff/windows-mini-hub.git"
},
"publish": {
  "provider": "github",
  "owner": "bdfyff",
  "repo": "windows-mini-hub"
}
```

The built-in update checker uses:

```ts
const updateRepo = process.env.WINDOWS_MINI_HUB_UPDATE_REPO ?? "bdfyff/windows-mini-hub";
```

When GitHub Actions builds a release, it automatically passes:

```text
WINDOWS_MINI_HUB_UPDATE_REPO=${{ github.repository }}
```

## Publish With GitHub Actions

This repository includes:

```text
.github/workflows/release.yml
```

The workflow runs on pushed tags matching `v*` and publishes the Windows `.exe` artifacts to GitHub Releases.

Create a release:

```bash
git tag v0.1.1
git push origin v0.1.1
```

Use a new version tag for every new release. If `v0.1.0` already exists, create the next tag instead of reusing it.

## Manual Publish

If you want to publish from your own PC:

```powershell
$env:GH_TOKEN="YOUR_PERSONAL_ACCESS_TOKEN"
$env:WINDOWS_MINI_HUB_UPDATE_REPO="bdfyff/windows-mini-hub"
npm run release
```

GitHub Actions is recommended because it uses `secrets.GITHUB_TOKEN` automatically.

## Roadmap

- Real signed releases
- Full auto-update through `electron-updater`
- More app detection rules
- More official app logos
- Better GitHub asset matching
- Optional silent install presets

## License

Add a license before publishing publicly if you want others to reuse or modify the project.
