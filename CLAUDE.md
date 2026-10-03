# dstorage (Tauri app)

Tray app that uploads files to S3 through a separate backend and copies a share link.
Tauri 2 + React 19 + TypeScript + Tailwind 4 + shadcn/ui. The backend lives in a
separate repo (`../golang-serividor-dstorage`) and is not covered by this file.

The full code standard is in [CONTRIBUTING.md](CONTRIBUTING.md). Read it before writing
code. The rules below are the ones that matter on every change.

## Rules

- **English everywhere** in code, comments, commits, docs and workflows. Portuguese only in
  the `pt` catalog (`src/i18n/messages.ts`) and `README.pt-BR.md`.
- **No user-facing string inline.** Use `t("area.key")` / `useI18n()`. Add every new key to
  **both** catalogs (`en` first); the build fails if one is missing.
- **TSDoc (`/** */`) on every exported symbol.** Inline `//` comments say *why*, not *what*.
- **Components:** named exports only, one exported component per file, `type XProps` above
  it, kebab-case file names. Full-window screens use `PageLayout`; icon buttons in headers
  use `HeaderButton`. The main screen never scrolls.
- **Colors from theme variables** (`bg-background`, `text-muted-foreground`), so both themes
  work.
- Do not hand-edit generated shadcn files in `src/components/ui/` or `kibo-ui/`; wrap them.

## Commands

```sh
bun run tauri dev      # run the app
bun run format         # Biome: format + safe fixes (run after every change)
bun run lint           # Biome in CI mode (no writes)
bun run typecheck      # tsc --noEmit
cd src-tauri && cargo fmt && cargo check
```

Before calling a task done: `bun run format`, `bun run lint`, `bun run typecheck`, and for
Rust changes `cargo fmt --check` and `cargo check`. CI runs the same.

## Working here

- **Edit files with the Edit tool.** Do not rewrite files with Python or PowerShell scripts.
- Biome enforces `noUnusedImports`, `noUnusedVariables` and `useBlockStatements` (braces on
  every `if`/`for`/`while`). Do not write `if (x) return;`.
- **Commits:** Conventional Commits in English (`feat:`, `fix:`, ...), **no `Co-Authored-By`
  line**. Do not commit or push unless asked. `release-please` reads the messages to version
  releases, so a user-visible change must be a `feat:` or `fix:`.
- `main` is the release branch: merging to it opens/updates the release PR; merging that PR
  publishes the installers. Do not edit versions by hand.

## Gotchas

- **Tray drop is Windows-only.** `src-tauri/src/lib.rs` creates a transparent window over the
  tray icon that is click-through except while a file drag is over it. macOS and Linux have
  no equivalent (Linux does not even report the icon position or emit tray clicks, which is
  why the tray menu has an **Open** item).
- The tray icon and menu are built from JS (`src/tray/`). Menu items must be created with
  `MenuItem.new`, not inline in `Menu.new({ items })`, or their `action` never fires.
- `VITE_*` variables are baked into the bundle at build time and readable by anyone. Never
  put secrets in them. CI builds use the `VITE_API_URL` repository variable.
- The main window is created hidden (`visible: false`) on purpose: the app starts in the tray.
  It has no decorations, so it cannot be dragged; it is positioned next to the tray icon.
- Settings and upload history live in `localStorage`, validated on read
  (`src/lib/settings.ts`, `src/lib/history.ts`).
- New Tauri permissions go in `src-tauri/capabilities/`, per window and as narrow as possible.
