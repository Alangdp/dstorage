import { t } from "@/i18n";
import { drawTrayIcon } from "./icon";
import { getTray } from "./setup";

/** How many blocks the progress stack beside the tray icon has. */
export const TRAY_SEGMENTS = 4;

/**
 * Shows on the tray icon how many of the 4 blocks are filled.
 * @param filled Blocks to light, or `null` to restore the default icon (nothing uploading).
 */
export async function setTrayProgress(filled: number | null) {
	const tray = getTray();
	if (!tray) {
		return;
	}

	const icon = await drawTrayIcon(
		filled === null ? null : { filled, segments: TRAY_SEGMENTS },
	);
	if (icon) {
		await tray.setIcon(icon);
	}
	await tray.setTooltip(
		filled === null
			? "dstorage"
			: t("tray.uploading", { filled, total: TRAY_SEGMENTS }),
	);
}
