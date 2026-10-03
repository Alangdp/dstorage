import { getCurrentWindow } from "@tauri-apps/api/window";
import {
	isPermissionGranted,
	requestPermission,
	sendNotification,
} from "@tauri-apps/plugin-notification";

/** Avisa pelo sistema, mas só se o usuário não estiver olhando a janela. */
export async function notifyIfHidden(title: string, body: string) {
	try {
		const win = getCurrentWindow();
		const [visible, minimized] = await Promise.all([
			win.isVisible(),
			win.isMinimized(),
		]);
		if (visible && !minimized) return;

		const granted =
			(await isPermissionGranted()) ||
			(await requestPermission()) === "granted";
		if (granted) sendNotification({ title, body });
	} catch (error) {
		console.error("Falha ao enviar a notificação", error);
	}
}
