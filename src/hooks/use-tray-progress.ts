import { useEffect } from "react";
import { useI18n } from "@/i18n";
import { setTrayProgress, TRAY_SEGMENTS } from "@/tray/progress";
import type { UploadItem } from "./use-uploads";

/** Filled blocks (1 to 4) for the overall progress, or null when nothing is uploading. */
function trayLevel(items: UploadItem[]) {
	const active = items.filter(
		(item) => item.status === "queued" || item.status === "uploading",
	);
	if (active.length === 0) {
		return null;
	}

	const total = active.reduce((sum, item) => sum + item.size, 0);
	const loaded = active.reduce(
		(sum, item) => sum + (item.size * item.progress) / 100,
		0,
	);
	const fraction = total === 0 ? 0 : loaded / total;

	// Starting already shows the first block, so the user can see something is happening.
	return Math.min(
		TRAY_SEGMENTS,
		Math.max(1, Math.ceil(fraction * TRAY_SEGMENTS)),
	);
}

/** Mirrors the upload progress on the tray icon. */
export function useTrayProgress(items: UploadItem[]) {
	const level = trayLevel(items);
	// Re-run on language changes too, because the tooltip text is translated.
	const { language } = useI18n();

	// biome-ignore lint/correctness/useExhaustiveDependencies: `language` only forces a refresh
	useEffect(() => {
		setTrayProgress(level).catch(console.error);
	}, [level, language]);
}
