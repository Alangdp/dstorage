import { useSyncExternalStore } from "react";
import { loadSettings, saveSettings, type Theme } from "./settings";

const query = window.matchMedia("(prefers-color-scheme: dark)");
const root = document.documentElement;

/** Liga ou desliga a classe `.dark` na raiz, que o Tailwind e as variáveis do shadcn usam. */
export function applyTheme(theme: Theme) {
	const dark = theme === "dark" || (theme === "system" && query.matches);
	root.classList.toggle("dark", dark);
}

/** Aplica o tema salvo e, no modo "system", acompanha mudanças do sistema. */
export function initTheme() {
	applyTheme(loadSettings().theme);
	query.addEventListener("change", () => applyTheme(loadSettings().theme));
}

/** Alterna entre claro e escuro a partir do que está na tela e guarda a escolha. */
export function toggleTheme() {
	const next: Theme = root.classList.contains("dark") ? "light" : "dark";
	try {
		saveSettings({ ...loadSettings(), theme: next });
	} catch {
		// Sem localStorage o tema vale só até fechar o app.
	}
	applyTheme(next);
}

function subscribe(onChange: () => void) {
	const observer = new MutationObserver(onChange);
	observer.observe(root, { attributes: true, attributeFilter: ["class"] });
	return () => observer.disconnect();
}

/** O tema escuro está ativo agora (inclusive quando vem do sistema). */
export function useIsDark() {
	return useSyncExternalStore(subscribe, () => root.classList.contains("dark"));
}
