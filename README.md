# dstorage

🇧🇷 [Leia em português](README.pt-BR.md)

A tray app for sending files to the cloud and sharing them by link. You drag a file in,
it uploads on its own, and the download link is already copied to your clipboard. Just
paste it wherever you want.

## What it does

- **Drag and drop uploads.** Drop one or more files on the window and the upload starts
  right away. Large files are sent in parts, so they never freeze the app.
- **A link ready to share.** When the upload finishes, the link is copied automatically.
  You can copy it again at any time from the upload list.
- **Link validity.** In Settings you choose how many hours the next links stay valid
  (1 to 168 hours, that is, up to 7 days). A link never outlives the file, which the
  server deletes after a fixed period.
- **History.** Uploaded files stay in the list with their state (uploading, done, failed,
  canceled). You can cancel an upload that is in progress.
- **Lives in the tray.** The app sits next to the clock and does not take up the taskbar.
  Click the icon to show or hide the window. Esc or the X button also hide it. The app
  only really quits through the icon's **Quit** menu.
- **Uploads in the background.** You can hide the window while uploads are running. When
  they finish (or fail), the system shows a notification.
- **Progress on the icon.** While uploading, the tray icon gets a stack of 4 blocks that
  fills up with the overall progress.
- **Light and dark themes.** The sun/moon button at the top switches between them.
- **English and Portuguese.** Pick the language in Settings, or leave it on "System" to
  follow your computer.
- **Start with the system.** In Settings you can have dstorage open on its own when the
  computer starts. It opens in the tray only, without showing the window.

## Differences between systems

The app works on all three systems, but the tray behaves differently on each.

### Windows

This is where everything works fully.

- Clicking the tray icon shows and hides the window; right-click shows the menu.
- **Dragging files straight onto the icon** opens the window so you can drop the file.
  For this the icon must be visible in the tray. Windows 11 tends to hide new icons in
  the arrow (^) menu: open it and drag the dstorage icon onto the bar, or turn it on in
  *Settings → Personalization → Taskbar → Other system tray icons*. When hidden, the app
  works normally; only the drag shortcut is turned off.

### macOS

- The icon sits in the menu bar at the top of the screen.
- Clicking opens and closes the window, and the menu has **Open** and **Quit**.
- Dragging a file straight onto the icon does not work on the Mac. Open the window and
  drop the file there.

### Linux

- The tray icon exists, but **Linux does not tell the app when you click it**. That is why
  the menu (right-click) has an **Open** option to show the window, besides **Quit**.
- **Dragging onto the icon does not work** on Linux. Open the window from the menu and
  drop the file there.
- Depending on your desktop environment, the tray may need an extension (on GNOME, for
  example, the app indicators extension).

## How it works behind the scenes

dstorage stores nothing on your computer except the history and your preferences. Files go
to your own server ([dstorage-server](../golang-serividor-dstorage)), which handles the
cloud storage and generates the links. Without the server running, the app cannot upload
anything.

Settings (link validity, theme, language, start with the system) apply to this computer only.

## Installing

Download the installer for your system from the [Releases](../../releases) page and run it.

## For people working on the code

You need [Bun](https://bun.sh), [Rust](https://rustup.rs) and the
[Tauri prerequisites](https://tauri.app/start/prerequisites/) for your system.

```sh
cp .env.example .env     # set VITE_API_URL to the server's address
bun install
bun run tauri dev        # opens the app in development mode
bun run tauri build      # builds the installers
```

Before opening a PR:

```sh
bun run format           # formats and fixes the code (Biome)
cd src-tauri && cargo fmt
```

Code conventions, translations and commit messages are described in
[CONTRIBUTING.md](CONTRIBUTING.md).

GitHub checks formatting, types and the build on every PR. Versions are released
automatically from commit messages in the `feat:`, `fix:`, etc. style: merging to `main`
makes [release-please](https://github.com/googleapis/release-please) open a release PR,
and merging that PR publishes the new version with the installers.
