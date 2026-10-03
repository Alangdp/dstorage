// This client's preferences, kept in the app's localStorage. Every installation has its
// own; server policy (file retention) does not live here.

import type { LanguageSetting } from "@/i18n";

const STORAGE_KEY = "dstorage.settings.v1";

export const MIN_LINK_EXPIRES_HOURS = 1;
export const MAX_LINK_EXPIRES_HOURS = 168; // S3 limit (7 days)

/** Interface theme; "system" follows the operating system. */
export type Theme = "system" | "light" | "dark";

/** User preferences for this computer. */
export type AppSettings = {
	/** Validity requested for shareable links, in hours. */
	linkExpiresHours: number;
	theme: Theme;
	language: LanguageSetting;
};

const DEFAULTS: AppSettings = {
	linkExpiresHours: 24,
	theme: "system",
	language: "system",
};

/** Whether `hours` is a whole number inside the range the server accepts. */
export function isValidLinkHours(hours: number) {
	return (
		Number.isInteger(hours) &&
		hours >= MIN_LINK_EXPIRES_HOURS &&
		hours <= MAX_LINK_EXPIRES_HOURS
	);
}

function isTheme(value: unknown): value is Theme {
	return value === "system" || value === "light" || value === "dark";
}

function isLanguageSetting(value: unknown): value is LanguageSetting {
	return value === "system" || value === "en" || value === "pt";
}

/** Reads the saved settings, falling back to the default for anything missing or invalid. */
export function loadSettings(): AppSettings {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		const parsed = raw ? (JSON.parse(raw) as Partial<AppSettings>) : {};
		return {
			linkExpiresHours: isValidLinkHours(parsed.linkExpiresHours ?? Number.NaN)
				? (parsed.linkExpiresHours as number)
				: DEFAULTS.linkExpiresHours,
			theme: isTheme(parsed.theme) ? parsed.theme : DEFAULTS.theme,
			language: isLanguageSetting(parsed.language)
				? parsed.language
				: DEFAULTS.language,
		};
	} catch {
		return DEFAULTS;
	}
}

/**
 * Persists the settings.
 * @throws When localStorage is unavailable or full.
 */
export function saveSettings(settings: AppSettings) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
