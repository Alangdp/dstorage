// Preferências deste cliente, guardadas no localStorage do app. Cada instalação tem
// as suas; o que é política do servidor (retenção dos arquivos) não fica aqui.

const STORAGE_KEY = "dstorage.settings.v1";

export const MIN_LINK_EXPIRES_HOURS = 1;
export const MAX_LINK_EXPIRES_HOURS = 168; // limite do S3 (7 dias)

export type Theme = "system" | "light" | "dark";

export type AppSettings = {
	/** Validade pedida para os links compartilháveis, em horas. */
	linkExpiresHours: number;
	/** Tema da interface; "system" acompanha o do sistema operacional. */
	theme: Theme;
};

const DEFAULTS: AppSettings = { linkExpiresHours: 24, theme: "system" };

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

export function loadSettings(): AppSettings {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		const parsed = raw ? (JSON.parse(raw) as Partial<AppSettings>) : {};
		return {
			linkExpiresHours: isValidLinkHours(parsed.linkExpiresHours ?? Number.NaN)
				? (parsed.linkExpiresHours as number)
				: DEFAULTS.linkExpiresHours,
			theme: isTheme(parsed.theme) ? parsed.theme : DEFAULTS.theme,
		};
	} catch {
		return DEFAULTS;
	}
}

export function saveSettings(settings: AppSettings) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
