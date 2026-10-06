# PRD: More actions on finished uploads

## 1. Summary

Finished uploads can already be copied, regenerated when the link expires, and removed from the
list. This adds the two missing actions: **open the link in the browser** and **delete the file
from S3**.

## 2. Contacts

| Name | Role | Comment |
|---|---|---|
| Álan Gabriel Dias Pedon | Owner, app and server dev | Approves scope and wording of the delete confirmation |

## 3. Background

- Today each finished item has one link button (copy, or regenerate when expired) and an `X`
  (`src/components/upload-list.tsx`).
- The `X` only removes the item from the local history. **The file stays on S3** until the
  retention rule deletes it, and its link keeps working until the link itself expires.
- The `opener` plugin is already installed (`tauri-plugin-opener`) and permitted
  (`opener:default` in the main capability), but nothing in `src/` uses it yet.
- The item model already has a `deleted` flag and a `file-deleted` link state, set when the
  server answers 410. Deleting on purpose can reuse them.

## 4. Objective

From the history, the person can preview what they shared and remove a file for real.

**Key results**

- "Open" opens the file's link in the default browser in one click, with a valid link.
- "Delete file" asks for confirmation, then the link stops working and the item shows as deleted.
- Opening a link never changes the clipboard.

## 5. Market segment

Everyone who uploads. Typical cases: "did I send the right file?" and "I sent that by mistake".
Constraint: the main screen never scrolls and rows are already tight (name, size, two buttons).

## 6. Value proposition

- **Gain:** check a link without pasting it somewhere, and fix a mistake immediately.
- **Pain avoided:** a wrongly shared file staying reachable for days.

## 7. Solution

### 7.1 UX

Replace the loose buttons with one **"more" (⋯) menu** per finished item, keeping the copy button
visible because it is the main action:

```
[icon] report.pdf        2.1 MB   [link]  [⋯]  [x]
                                    Open in browser
                                    Delete file…
```

Add the shadcn `dropdown-menu` component (generated; do not hand-edit it) and wrap it in our own
component. Use it in both the main list and the history page.

### 7.2 Key features

1. **Open in browser.**
   - Uses `openUrl` from `@tauri-apps/plugin-opener` with the item's current link.
   - If the link has expired, generate a new one first, **without copying it**. Today
     `refreshLink` in `use-uploads.ts` always copies to the clipboard; split it so the copy is
     optional.
   - Hidden when the file is already deleted.
2. **Delete file.**
   - Opens a confirmation dialog (the `Dialog` component already exists) naming the file and
     saying the link will stop working and it cannot be undone.
   - Calls `POST /uploads/delete` (see the server PRD below). On success the item is marked
     `deleted: true` and stays in the history as deleted; the `X` still removes it from the list.
   - On failure show the error on the item. If the server answers 404 (older server without the
     route), show a message saying the server does not support deleting yet.
3. **API client.** New `deleteFile(key)` in `src/lib/upload/api.ts` next to `getDownloadLink`.
4. **Strings.** New keys in both catalogs, `en` first.

### 7.3 Dependencies

- **Server:** `golang-serividor-dstorage/docs/PRD-apagar-arquivo.md` (`POST /uploads/delete`).
  "Open in browser" does not depend on it and can ship first.

### 7.4 Assumptions

- `opener:default` allows opening `http`/`https` links. **Validate** it; if not, add the
  narrowest permission that does.
- Confirming with a dialog is enough; no need to ask for the password again.

## 8. Release

| Version | Content | Size |
|---|---|---|
| v1 | "More" menu and Open in browser (no server change) | Small (about a day) |
| v2 | Delete file, after the server route is live | Small |
| Later | Per-file retention picker at upload time (`PRD-retencao-por-arquivo.md` on the server) | Medium |
