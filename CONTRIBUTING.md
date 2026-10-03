# Contributing

This document is the code standard for dstorage. Biome and `cargo fmt` enforce the
mechanical parts (formatting, imports, lint); the rest is a convention to follow in review.

## Language

- **Everything in the repository is in English**: code, identifiers, comments, commit
  messages, PR titles, workflow files and documentation. The only Portuguese allowed is
  the `pt` catalog (`src/i18n/messages.ts`) and `README.pt-BR.md`.
- **User-facing text is never written inline in a component.** It goes through the i18n
  layer (see below), so it can be translated.
- Strings that are not for the user (`console.error` messages, thrown programmer errors)
  are plain English and are not translated.

## Translations (i18n)

The app has its own tiny i18n layer in `src/i18n/`, with no external dependency.

- **`en` is the source of truth** (`src/i18n/messages.ts`). Add the key there first. `pt`
  is typed as `Messages`, so the build fails if a key is missing in any language.
- **Keys** are `area.camelCaseName` (`settings.errorSave`, `list.actionCopy`). The area
  is the screen or module that uses it; `common.*` is for words reused everywhere.
- **Placeholders** use `{name}` and are filled by `t(key, { name })`. Never build a
  sentence by concatenating translated pieces; give the translator the whole sentence.
- **In React**, call `const { t } = useI18n()` so the component re-renders when the
  language changes. **Outside React** (helpers, tray code), import `t` directly and call
  it at the moment the text is needed, never at module load.
- Dates and numbers use `getLocale()` (see `formatDateTime`), not a hard-coded locale.
- To add a language: add it to `Language` and `LANGUAGES`, create its catalog typed
  `Messages`, register it in `CATALOGS` and `LOCALES`, and add a label key for the picker.

## Comments and documentation (TSDoc)

- **Every exported symbol has a TSDoc comment** (`/** ... */`): functions, hooks,
  components, types, constants that are not self-evident. One sentence saying *what it is
  or does*; add more only when behavior is not obvious.
- Use `@param` and `@returns` only when they add something the name and type do not.
  Never repeat the type inside the tag (`@param {string} x` is wrong; TypeScript has it).
  Use `@throws` when a function can throw something callers should handle.
- **Props are documented on the `Props` type**, one `/** ... */` per field that is not
  obvious.
- **Inline `//` comments explain *why*, not *what*.** If a comment restates the next line,
  delete it. Document workarounds and non-obvious constraints (a platform quirk, a
  library limitation) right where they apply.
- Comments are full sentences, in English, ending with a period when they are sentences.
- No commented-out code and no `TODO` without context. If something is unfinished, say what
  and why.

```ts
/**
 * Uploads a file to S3 in parts, a few at a time, so only a few parts sit in memory.
 * @returns The object key on S3.
 */
export async function uploadFile(file: File, options: UploadOptions) { ... }
```

## TypeScript and React

### Files and names

| Thing | Convention | Example |
|---|---|---|
| Files | `kebab-case` | `upload-list.tsx`, `use-uploads.ts` |
| Components, types | `PascalCase` | `SettingsPage`, `UploadItem` |
| Functions, variables | `camelCase` | `getLinkState` |
| Hooks | `useX`, file `use-x.ts` in `src/hooks/` | `useTrayProgress` |
| Constants | `UPPER_SNAKE_CASE` after the imports | `MAX_LINK_EXPIRES_HOURS` |
| Message keys | `area.camelCase` | `settings.errorSave` |

### Components

- **Named exports only** (`export function Foo`), no default exports.
- **One exported component per file.** Small private helper components go above it in
  the same file.
- **Props are a `type FooProps`** declared right above the component, destructured in the
  signature. Prefer `type` over `interface`.
- **Order inside a file:** imports → constants → types → private helpers → exported
  component (or functions).
- **Order inside a component:** hooks → derived values → effects → handlers → JSX.
- **Every full-window screen is built on `PageLayout`** (`src/components/page-layout.tsx`):
  header with an optional back arrow, title, extra actions and the close button, then the
  content and an optional footer. Do not hand-roll a header. Use `HeaderButton` for icon
  buttons in it. The main screen never scrolls (`scroll={false}`), so anything that can
  grow goes behind a button into a scrollable screen such as the history.
- Components are presentational where possible. Logic that is reused or stateful lives in
  a hook (`src/hooks/`) or a module (`src/lib/`).
- Use the shadcn components in `src/components/ui/` and Tailwind classes. Do not edit the
  generated `ui/` files for app-specific behavior; wrap them instead.
- Colors come from the theme variables (`bg-background`, `text-muted-foreground`, ...) so
  both themes work. No hard-coded colors, except for status accents that are deliberate.

### Code

- `strict` TypeScript. No `any`; use `unknown` and narrow.
- Prefer small pure functions in `src/lib/` that are easy to reason about, with the side
  effects (storage, network, Tauri calls) kept at the edges.
- Handle failure where it can happen and decide there: either recover, or surface it to
  the user with a translated message. Do not swallow errors silently unless an empty
  `catch` has a comment saying why that is fine.
- Persisted data (`localStorage`) is validated on read, falling back to defaults.
- Imports use the `@/` alias for anything under `src/`.

## Rust (`src-tauri`)

- Format with `cargo fmt`. CI fails on unformatted code.
- Document functions with `///` doc comments, in English, explaining intent and any
  platform constraint. Gate platform-specific code with `#[cfg(windows)]` etc.
- Keep the Rust side thin: window and OS plumbing that the web layer cannot do. App logic
  lives in TypeScript.
- New permissions go in `src-tauri/capabilities/`, as narrow as possible and per window.

## Commits and pull requests

- **Conventional Commits in English**: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`,
  `ci:`. Use `!` or a `BREAKING CHANGE:` footer for breaking changes.
- The messages drive releases: `release-please` reads them to pick the next version and
  write the changelog, so a `feat:` or `fix:` that is user-visible must say so clearly.
- Keep PRs focused. Run `bun run format`, `bun run lint`, `bun run typecheck` and
  `cargo fmt --check` before pushing; CI runs the same checks.
