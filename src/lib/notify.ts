import { getCurrentWindow } from "@tauri-apps/api/window";
import {
	isPermissionGranted,
	requestPermission,
	sendNotification,
} from "@tauri-apps/plugin-notification";

/**
 * Shows a system notification, but only when the user is not looking at the window.
 * Failures are logged and swallowed: a missing notification must never break an upload.
 */
export async function notifyIfHidden(title: string, body: string) {
	try {
		const win = getCurrentWindow();
		const [visible, minimized] = await Promise.all([
			win.isVisible(),
			win.isMinimized(),
		]);
		if (visible && !minimized) {
			return;
		}

		const granted =
			(await isPermissionGranted()) ||
			(await requestPermission()) === "granted";
		if (granted) {
			sendNotification({ title, body });
		}
	} catch (error) {
		console.error("Failed to send the notification", error);
	}
}
