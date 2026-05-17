# Worktree Manager

A macOS desktop app for managing local Git worktrees.

Worktree Manager is built for developer productivity workflows where one repository is split into multiple working folders for parallel branches, reviews, experiments, or feature work.

## Features

- Register local Git projects from a native folder picker, manual path input, or drag and drop.
- List `git worktree list --porcelain` results with parsed path, branch, status, dirty state, and latest commit.
- Create and remove worktrees.
- Open worktrees in Cursor or VS Code.
- Search projects, worktrees, and actions with a Raycast-style command palette using `Cmd+K`.
- Persist registered projects locally in Electron app data.
- Show compact terminal-style logs for Git and app actions.
- Dark/light theme support.

## Download

Latest release:

https://github.com/hyjoong/worktree-manager/releases/latest

macOS arm64 assets are published as:

- `Worktree.Manager-*-mac-arm64.dmg`
- `Worktree.Manager-*-mac-arm64.zip`

Current builds are unsigned and not notarized. macOS may show a security warning when opening the app for the first time.

## Requirements

- macOS on Apple Silicon for the published arm64 builds.
- Git installed and available on `PATH`.
- Cursor and/or VS Code installed if you want to use the editor open actions.

## Development

Install dependencies:

```bash
pnpm install
```

Run the Electron app in development:

```bash
pnpm dev
```

Run checks:

```bash
pnpm typecheck
pnpm test
pnpm build
```

Generate the macOS app icon from `assets/icon-source.png`:

```bash
pnpm icon:mac
```

Build macOS release artifacts:

```bash
pnpm dist:mac
```

Artifacts are written to:

```text
release/<version>/
```

## Architecture

```text
src/
  main/
    git/
    ipc/
    settings/
  preload/
  renderer/
    components/
    hooks/
    lib/
    stores/
    types/
  shared/
```

The renderer does not access Node APIs directly. Git and filesystem-adjacent operations are exposed through a typed preload API and validated IPC handlers.

Git commands are executed with `execa` using argument arrays, not shell string composition.

## Security Notes

- `contextIsolation` is enabled.
- `nodeIntegration` is disabled.
- Electron sandboxing is enabled.
- IPC inputs are validated with `zod`.
- IPC senders and renderer navigation are restricted to packaged file URLs and the local Vite dev server.

## Packaging Notes

The app uses `electron-builder` with:

- `asar: true`
- macOS `dmg` and `zip` targets
- custom `build/icon.icns`
- unsigned local distribution for now

For public distribution, the next step is Apple Developer ID signing and notarization.
