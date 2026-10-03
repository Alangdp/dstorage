import type { UploadItem } from "@/hooks/use-uploads";

// Histórico guardado no localStorage do webview (fica no perfil do app).
const STORAGE_KEY = "dstorage.history.v1";
const MAX_ITEMS = 200;

/** Envios que ainda estavam em andamento não sobrevivem ao fechamento do app. */
function isInFlight(item: UploadItem) {
	return item.status === "queued" || item.status === "uploading";
}

export function loadHistory(): UploadItem[] {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		const items = raw ? (JSON.parse(raw) as UploadItem[]) : [];

		return items.map((item) =>
			isInFlight(item)
				? {
						...item,
						status: "error",
						error: "Envio interrompido ao fechar o app",
					}
				: { ...item, copied: false },
		);
	} catch {
		return [];
	}
}

/** Guarda tudo que terminou (enviado, com erro ou cancelado) e o que ficou pendente. */
export function saveHistory(items: UploadItem[]) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(-MAX_ITEMS)));
	} catch {
		// localStorage indisponível ou cheio: o histórico simplesmente não persiste.
	}
}
