import { exit } from "@tauri-apps/api/app";
import { Menu, MenuItem } from "@tauri-apps/api/menu";
import { TrayIcon } from "@tauri-apps/api/tray";
import { subscribeToLanguage, t } from "@/i18n";
import { drawTrayIcon, onSystemThemeChange } from "./icon";
import { openMainWindow, toggleMainWindow } from "./window";

const TRAY_ID = "main-tray";

let tray: TrayIcon | null = null;

/** The tray created by {@link setupTray}, or null while it does not exist yet. */
export function getTray() {
	return tray;
}

/**
 * Builds the tray menu in the current language.
 *
 * Items must be created with `MenuItem.new` (not inline in `Menu.new({ items })`): in
 * Tauri, inline items have their `action` channel dropped right after creation, so the
 * click reaches Rust but never JS.
 */
async function buildMenu() {
	// On Linux the tray emits no clicks, so the menu is the only way to open the window.
	const open = await MenuItem.new({
		id: "open",
		text: t("tray.open"),
		action: () => {
			void openMainWindow().catch(console.error);
		},
	});

	const quit = await MenuItem.new({
		id: "quit",
		text: t("tray.quit"),
		action: () => {
			void exit(0);
		},
	});

	return Menu.new({ items: [open, quit] });
}

/** Creates the tray icon and keeps its menu in sync with the app language. */
export async function setupTray() {
	// In dev, every webview reload would leave an old tray behind with dead callbacks.
	await TrayIcon.removeById(TRAY_ID).catch(() => {});

	tray = await TrayIcon.new({
		id: TRAY_ID,
		icon: (await drawTrayIcon(null)) ?? undefined,
		menu: await buildMenu(),
		// Left click toggles the window; the menu stays on the right button.
		showMenuOnLeftClick: false,
		action: (event) => {
			// Click fires on both Down and Up; react only once.
			if (
				event.type === "Click" &&
				event.button === "Left" &&
				event.buttonState === "Up"
			) {
				void toggleMainWindow(event.rect).catch(console.error);
			}
		},
	});

	subscribeToLanguage(() => {
		void buildMenu()
			.then((menu) => tray?.setMenu(menu))
			.catch(console.error);
	});

	onSystemThemeChange(() => {
		void drawTrayIcon(null)
			.then((icon) => (icon ? tray?.setIcon(icon) : undefined))
			.catch(console.error);
	});
}
