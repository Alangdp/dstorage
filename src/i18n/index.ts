import { useSyncExternalStore } from "react";
import { en, type MessageKey, type Messages, pt } from "./messages";

export type { MessageKey } from "./messages";

/** A language the app is translated into. */
export type Language = "en" | "pt";

/** What the user picks: a concrete language, or follow the operating system. */
export type LanguageSetting = Language | "system";

/** Languages in the order they are offered in the settings page. */
export const LANGUAGES: readonly Language[] = ["en", "pt"];

const CATALOGS: Record<Language, Messages> = { en, pt };

/** BCP 47 locale used for dates and numbers in each language. */
const LOCALES: Record<Language, string> = { en: "en-US", pt: "pt-BR" };

const listeners = new Set<() => void>();

/** Resolves a setting to a concrete language; "system" follows the OS/browser locale. */
export function resolveLanguage(setting: LanguageSetting): Language {
	if (setting !== "system") {
		return setting;
	}
	return navigator.language.toLowerCase().startsWith("pt") ? "pt" : "en";
}

let current: Language = resolveLanguage("system");

/** The language currently in use. */
export function getLanguage() {
	return current;
}

/** The BCP 47 locale for the language currently in use. */
export function getLocale() {
	return LOCALES[current];
}

/**
 * Switches the app language and notifies every subscriber (React components, the
 * tray menu). Does nothing when the resolved language is already active.
 */
export function setLanguage(setting: LanguageSetting) {
	const next = resolveLanguage(setting);
	if (next === current) {
		return;
	}

	current = next;
	document.documentElement.lang = next;
	for (const listener of listeners) {
		listener();
	}
}

/**
 * Registers a callback that runs after every language change.
 * @returns A function that removes the callback.
 */
export function subscribeToLanguage(listener: () => void) {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

/**
 * Translates a key into the current language.
 * @param params Values for the `{name}` placeholders in the message.
 */
export function t(key: MessageKey, params?: Record<string, string | number>) {
	const message = CATALOGS[current][key];
	if (!params) {
		return message;
	}
	return message.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
		name in params ? String(params[name]) : placeholder,
	);
}

/**
 * React binding for the i18n module. Components that call it re-render when the
 * language changes, so the `t` they use always returns the current language.
 */
export function useI18n() {
	const language = useSyncExternalStore(subscribeToLanguage, getLanguage);
	return { language, t };
}
