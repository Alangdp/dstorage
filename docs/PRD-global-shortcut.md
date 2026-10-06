# PRD: Global shortcut

## 1. Summary

Add a keyboard shortcut that works from any program and opens (or hides) the dstorage window.
Together with paste (`PRD-paste-to-upload.md`), the flow becomes: shortcut, `Ctrl+V`, link.

## 2. Contacts

| Name | Role | Comment |
|---|---|---|
| Álan Gabriel Dias Pedon | Owner, app and server dev | Decides the default key and scope |

## 3. Background

- The app starts hidden in the tray. To use it you must find the tray icon and click it.
- `toggleMainWindow` (`src/tray/window.ts`) already shows the window next to the tray icon and
  hides it again. It needs the icon's rectangle, which the app gets from tray clicks and from
  the transparent drop window. A keyboard shortcut has no such rectangle.
- `openMainWindow()` already shows and focuses the window without positioning it. That is the
  fallback this feature needs.
- There is no global shortcut plugin in `src-tauri/Cargo.toml` today.

## 4. Objective

Open the app from anywhere with one key combination, and let the person choose which one.

**Key results**

- Pressing the shortcut opens the window focused in under 300 ms, from any program.
- Pressing it again hides the window.
- If the chosen combination is already taken by another program, the user sees a clear message
  and the old shortcut keeps working. No silent failures.

## 5. Market segment

Power users of a tray app who keep their hands on the keyboard. Constraint: another program may
already own a combination, and some platforms limit global shortcuts (see assumptions).

## 6. Value proposition

- **Gain:** no hunting for the tray icon.
- **Pain avoided:** breaking the flow of whatever the person is doing.

## 7. Solution

### 7.1 Flow

```
any program -> Ctrl+Shift+U -> window opens focused -> Ctrl+V (paste) or drop -> link copied
```

### 7.2 Key features

1. **Shortcut registration.** On start the app registers the saved combination. Default
   proposal: `Ctrl+Shift+U` (to be confirmed).
2. **Toggle.** First press shows and focuses the window; pressing while it is visible hides it
   (same rule as `toggleMainWindow`: visible and not minimized means hide).
3. **Position.** Save the last known tray rectangle and use it with `positionNearTray`. If there
   is none yet, fall back to `openMainWindow()`.
4. **Setting.** A new "Global shortcut" field in the settings screen, stored in
   `localStorage` with the other settings and validated on read (`src/lib/settings.ts`).
   Supports changing it and turning it off.
5. **Conflicts.** Registration can fail. Show the error in settings and keep the previous
   shortcut registered.
6. **Cleanup.** Unregister the old combination before registering a new one.

### 7.3 Technology

- Add `tauri-plugin-global-shortcut` (Rust) and `@tauri-apps/plugin-global-shortcut` (JS).
- New permissions in `src-tauri/capabilities/` for the main window only, as narrow as
  possible: register, unregister and is-registered.
- New strings in both catalogs (`en` first).

### 7.4 Assumptions

- The default combination is free on most machines. **Validate** against common apps.
- Global shortcuts may not work on Linux under Wayland. Treat it as unsupported there until
  tested, and keep the tray menu's **Open** item as the way in.
- **Not in this version:** uploading straight from the clipboard without opening the window.
  Images on the clipboard could be read with the clipboard-manager plugin, but a list of copied
  files cannot, so it would need native code. Worth a separate PRD once paste is in use.

## 8. Release

| Version | Content | Size |
|---|---|---|
| v1 | Plugin, registration, toggle, settings field, error messages | Medium (a few days) |
| Later | Upload an image on the clipboard directly from the shortcut | Medium, needs its own PRD |

No server dependency. Best released together with, or after, paste to upload.
