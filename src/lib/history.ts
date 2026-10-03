import type { UploadItem } from "@/hooks/use-uploads";
import { t } from "@/i18n";

// History kept in the webview's localStorage (it lives in the app profile).
const STORAGE_KEY = "dstorage.history.v1";
const MAX_ITEMS = 200;

/** Uploads that were still running do not survive the app being closed. */
function isInFlight(item: UploadItem) {
	return item.status === "queued" || item.status === "uploading";
}

/** Reads the saved history, marking interrupted uploads as failed. */
export function loadHistory(): UploadItem[] {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		const items = raw ? (JSON.parse(raw) as UploadItem[]) : [];

		return items.map((item) =>
			isInFlight(item)
				? { ...item, status: "error", error: t("error.interrupted") }
				: { ...item, copied: false },
		);
	} catch {
		return [];
	}
}

/** Saves everything that finished (uploaded, failed or canceled) and what is still pending. */
export function saveHistory(items: UploadItem[]) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(-MAX_ITEMS)));
	} catch {
		// localStorage unavailable or full: the history simply does not persist.
	}
}
