import { listen } from "@tauri-apps/api/event";
import {
	getCurrentWindow,
	monitorFromPoint,
	PhysicalPosition,
	type PhysicalSize,
} from "@tauri-apps/api/window";

import { TRAY_DRAG_ENTER } from "./events";

/** Position and size of the tray icon on screen, in physical pixels. */
export type TrayRect = { position: PhysicalPosition; size: PhysicalSize };

const TRAY_WINDOW_GAP = 8;

/**
 * Snaps the window to the tray icon: above it when the taskbar is at the bottom, below
 * when it is at the top. Everything in physical pixels, clamped to the work area.
 */
async function positionNearTray(rect: TrayRect) {
	const win = getCurrentWindow();
	const iconCenterX = rect.position.x + rect.size.width / 2;
	const iconCenterY = rect.position.y + rect.size.height / 2;

	const monitor = await monitorFromPoint(iconCenterX, iconCenterY);
	if (!monitor) {
		return;
	}

	const { position: wa, size: ws } = monitor.workArea;
	const { width, height } = await win.outerSize();

	const taskbarAtBottom = iconCenterY > wa.y + ws.height / 2;

	const x = Math.min(
		Math.max(iconCenterX - width / 2, wa.x),
		wa.x + ws.width - width,
	);
	const y = taskbarAtBottom
		? rect.position.y - height - TRAY_WINDOW_GAP
		: rect.position.y + rect.size.height + TRAY_WINDOW_GAP;

	await win.setPosition(
		new PhysicalPosition(
			Math.round(x),
			Math.round(Math.min(Math.max(y, wa.y), wa.y + ws.height - height)),
		),
	);
}

/**
 * Hides the main window if it is showing, otherwise shows it next to the tray icon.
 * A tray click takes focus away from the window, so `isFocused` cannot decide this:
 * visible and not minimized => hide; anything else => show and focus.
 */
export async function toggleMainWindow(rect: TrayRect) {
	const win = getCurrentWindow();
	const [visible, minimized] = await Promise.all([
		win.isVisible(),
		win.isMinimized(),
	]);

	if (visible && !minimized) {
		await win.hide();
		return;
	}

	await showMainWindow(rect);
}

/** Opens the window wherever it is, without positioning it (there is no tray rectangle, as on Linux). */
export async function openMainWindow() {
	const win = getCurrentWindow();
	await win.show();
	await win.unminimize();
	await win.setFocus();
}

async function showMainWindow(rect: TrayRect) {
	await positionNearTray(rect);
	await openMainWindow();
}

/** Opens the window when the transparent window over the tray icon reports a file dragged onto it. */
export async function setupTrayDropEvents() {
	await listen<TrayRect>(TRAY_DRAG_ENTER, async (event) => {
		const win = getCurrentWindow();
		if (await win.isVisible()) {
			return;
		}
		// No setFocus: stealing focus would cancel the drag in progress.
		await positionNearTray(event.payload);
		await win.show();
	});
}

/** The close button hides the window in the tray; the app only quits through "Quit". */
export async function setupCloseToTray() {
	await getCurrentWindow().onCloseRequested(async (event) => {
		event.preventDefault();
		await getCurrentWindow().hide();
	});
}
