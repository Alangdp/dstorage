import { useSyncExternalStore } from "react";
import { loadSettings, saveSettings, type Theme } from "./settings";

const query = window.matchMedia("(prefers-color-scheme: dark)");
const root = document.documentElement;

/** Toggles the `.dark` class on the root, which Tailwind and the shadcn variables use. */
export function applyTheme(theme: Theme) {
	const dark = theme === "dark" || (theme === "system" && query.matches);
	root.classList.toggle("dark", dark);
}

/** Applies the saved theme and, in "system" mode, follows operating system changes. */
export function initTheme() {
	applyTheme(loadSettings().theme);
	query.addEventListener("change", () => applyTheme(loadSettings().theme));
}

/** Switches between light and dark based on what is on screen, and saves the choice. */
export function toggleTheme() {
	const next: Theme = root.classList.contains("dark") ? "light" : "dark";
	try {
		saveSettings({ ...loadSettings(), theme: next });
	} catch {
		// Without localStorage the theme only lasts until the app closes.
	}
	applyTheme(next);
}

function subscribe(onChange: () => void) {
	const observer = new MutationObserver(onChange);
	observer.observe(root, { attributes: true, attributeFilter: ["class"] });
	return () => observer.disconnect();
}

/** Whether the dark theme is active right now (including when it comes from the system). */
export function useIsDark() {
	return useSyncExternalStore(subscribe, () => root.classList.contains("dark"));
}
