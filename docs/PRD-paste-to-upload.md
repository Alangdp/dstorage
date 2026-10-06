# PRD: Paste to upload

## 1. Summary

Let people send files by pasting them (`Ctrl+V`) into the app window, the same way they can
drop them today. A screenshot on the clipboard becomes an upload with one key press.

## 2. Contacts

| Name | Role | Comment |
|---|---|---|
| Álan Gabriel Dias Pedon | Owner, app and server dev | Approves scope |

## 3. Background

- Today a file enters the app only by dropping it on the drop zone (`MainPage` → `Dropzone` →
  `onAddFiles`) or by dragging it onto the tray icon (Windows only).
- Copying a file or taking a screenshot and pasting it is the fastest way to share something,
  and the app has no support for it.
- All uploads already go through one gate, `handleAddFiles` in `src/App.tsx`: it queues the
  files when signed in, and opens the sign-in screen otherwise. Paste can reuse it unchanged.

## 4. Objective

Pasting files or an image into the app queues them for upload, with the same rules as a drop.

**Key results**

- A file copied in the file explorer and pasted on the main screen is queued in under one second.
- A pasted screenshot gets a readable name (not `image.png`) in 100% of cases.
- Zero uploads start while the user is typing in a text field.

## 5. Market segment

People who share files and screenshots many times a day and want the fewest steps possible.
Constraint: the app lives in the tray and its window is usually hidden, so paste only works
while the window is open and focused. The global shortcut (`PRD-global-shortcut.md`) is what
brings the window up quickly.

## 6. Value proposition

- **Gain:** copy, open the app, `Ctrl+V`, link ready.
- **Pain avoided:** saving a screenshot to disk just to drag it in.
- **Cost:** nearly none; no new dependency.

## 7. Solution

### 7.1 Flow

```
copy a file / take a screenshot -> open window -> Ctrl+V -> item appears in the list
                                                          -> link copied when done
```

### 7.2 Key features

1. **Paste listener.** A hook (`src/hooks/use-paste-upload.ts`) adds a `paste` listener on
   `window` and passes `event.clipboardData.files` to `handleAddFiles`.
2. **Only where it makes sense.** Active on the main screen only. Ignored when the event
   target is an `input`, `textarea` or editable element (so the login form and settings keep
   working). History and settings screens do not upload on paste.
3. **Readable names for images.** A pasted image arrives as `image.png`. Rename it to
   `pasted-image-YYYY-MM-DD-HHmmss.<ext>` (extension from the MIME type).
4. **Not signed in.** Same behavior as a drop: the sign-in screen opens (`handleAddFiles`).
5. **Errors.** Size and server errors go through the existing upload flow; nothing new.
6. **Text.** Pasting plain text is ignored in this version.

### 7.3 Technology

- Standard browser clipboard events; no Tauri plugin and no new permission.
- Follow the repo rules: named exports, TSDoc on exports, braces on every `if`, no inline
  strings (add any new key to both catalogs, `en` first).

### 7.4 Assumptions

- WebView2 on Windows delivers files copied in Explorer as `File` objects in
  `clipboardData.files`. **Validate this first.** If it does not, reading a copied file list
  needs native code (the Windows `CF_HDROP` format) and this PRD changes scope.
- macOS and Linux webviews behave similarly for images; file lists may differ.

## 8. Release

| Version | Content | Size |
|---|---|---|
| v1 | Paste of files and images on the main screen, image naming | Small (about a day, plus validation) |
| Later | Paste plain text as a `.txt` upload; paste on the history screen | Small each |

No dependency on the server. Ship after, or together with, the global shortcut.
