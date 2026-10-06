import {
	isRegistered,
	register,
	unregister,
} from "@tauri-apps/plugin-global-shortcut";
import { loadSettings } from "@/lib/settings";
import { toggleMainWindow } from "./window";

// The combination this app currently holds, so a change can release exactly that one.
let current: string | null = null;

function handleShortcut(event: { state: "Pressed" | "Released" }) {
	// The plugin reports both edges; reacting to both would open and hide in one keystroke.
	if (event.state === "Pressed") {
		void toggleMainWindow().catch(console.error);
	}
}

/**
 * Makes `next` the global shortcut that toggles the window, or turns it off with null.
 * The new combination is registered before the old one is released, so when the system
 * refuses it (another program owns it) the previous shortcut keeps working.
 * @throws When the combination cannot be registered.
 */
export async function applyGlobalShortcut(next: string | null) {
	if (next === current) {
		return;
	}

	if (next) {
		await register(next, handleShortcut);
	}

	const previous = current;
	current = next;
	if (previous) {
		await unregister(previous).catch(console.error);
	}
}

/** Registers the saved shortcut at startup. A failure is logged: there is no screen to show it on yet. */
export async function setupGlobalShortcut() {
	const saved = loadSettings().globalShortcut;
	if (!saved) {
		return;
	}

	// After a webview reload (dev) the Rust side still holds the old registration, whose
	// callback channel is dead, and registering the same combination again would fail.
	if (await isRegistered(saved)) {
		await unregister(saved);
	}
	await applyGlobalShortcut(saved);
}
