# Windows Mini Hub

Desktop setup hub for a fresh Windows install: app selection, WinGet installs, GitHub/direct downloads, safe Windows tweaks, live logs, installed-app scan, profiles, diagnostics, and release-ready packaging.

## Stack

- Electron
- React + Vite + TypeScript
- Tailwind CSS
- shadcn/ui-style local components
- Node.js `child_process`
- WinGet
- PowerShell
- electron-builder

## Commands

```bash
npm install
npm run dev
npm run build
npm run pack
npm run dist
npm run release
```

- `npm run dev` starts Vite and Electron.
- `npm run build` builds renderer, main, and preload.
- `npm run pack` builds an unpacked app into `release/`.
- `npm run dist` builds local Windows portable/installer `.exe` artifacts.
- `npm run release` publishes artifacts to GitHub Releases when `GH_TOKEN` is available.

## GitHub Release Setup

Before publishing, replace placeholders in `package.json`:

```json
"repository": {
  "type": "git",
  "url": "https://github.com/YOUR_GITHUB_USERNAME/windows-mini-hub.git"
},
"publish": {
  "provider": "github",
  "owner": "YOUR_GITHUB_USERNAME",
  "repo": "windows-mini-hub"
}
```

Replace `YOUR_GITHUB_USERNAME` with your GitHub username. If you choose a different repository name, replace `windows-mini-hub` too.

Also update `src/main/index.ts` if you want local builds to check your repo for updates by default:

```ts
const updateRepo = process.env.WINDOWS_MINI_HUB_UPDATE_REPO ?? "YOUR_GITHUB_USERNAME/windows-mini-hub";
```

GitHub Actions already passes `WINDOWS_MINI_HUB_UPDATE_REPO` automatically as `${{ github.repository }}` for release builds.

## Create And Push Repo

1. Create a new repository on GitHub:
   - Open https://github.com/new
   - Repository name: `windows-mini-hub`
   - Visibility: Public or Private
   - Do not add README, `.gitignore`, or license on GitHub, because this project already has files.

2. In this folder, run:

```bash
git init
git add .
git commit -m "Initial Windows Mini Hub release setup"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/windows-mini-hub.git
git push -u origin main
```

3. Create a release tag:

```bash
git tag v0.1.0
git push origin v0.1.0
```

GitHub Actions will run `.github/workflows/release.yml`, build on `windows-latest`, and publish the `.exe` files to GitHub Releases.

## Manual Local Publish

If you want to publish from your PC instead of GitHub Actions:

```bash
$env:GH_TOKEN="YOUR_PERSONAL_ACCESS_TOKEN"
$env:WINDOWS_MINI_HUB_UPDATE_REPO="YOUR_GITHUB_USERNAME/windows-mini-hub"
npm run release
```

Usually GitHub Actions is easier because it uses `secrets.GITHUB_TOKEN` automatically.

## What Is Included

- Dashboard with stats, smart recommendations, installed app scan, and quick actions.
- Apps page with filters, profiles, source badges, details, install summary, GitHub asset picker, and download progress.
- Tweaks page with safe Windows tweaks and confirmation.
- Logs page with terminal-style live output.
- Sources page for official/manual source URLs.
- Settings with theme, compact mode, portable mode, diagnostics export, admin restart, version/build info, and update check.

## Secure Electron Architecture

Renderer has no direct Node.js access. The UI only calls methods exposed by `src/preload/index.ts` through `contextBridge`. Commands such as `winget`, downloads, and `powershell.exe` run only in the main process through allowlisted IPC handlers.
