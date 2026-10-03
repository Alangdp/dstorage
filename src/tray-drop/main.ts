import { emit } from "@tauri-apps/api/event";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { TRAY_DRAG_ENTER } from "@/tray/events";

// This window sits over the tray icon but only receives the mouse during a drag (the
// Rust side keeps it transparent to clicks the rest of the time). When a file enters,
// the main window is opened to receive the drop.

/** The icon's rectangle, which is this window's own position and size. */
async function trayRect() {
	const win = getCurrentWindow();
	const [position, size] = await Promise.all([
		win.outerPosition(),
		win.outerSize(),
	]);
	return { position, size };
}

// Comes from Tauri's native event (this window keeps the system drag-drop on);
// the HTML5 drag events do not fire in that mode.
getCurrentWebview()
	.onDragDropEvent((event) => {
		if (event.payload.type === "enter") {
			void trayRect().then((rect) => emit(TRAY_DRAG_ENTER, rect));
		}
	})
	.catch(console.error);
