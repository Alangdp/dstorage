import { useEffect } from "react";
import { setTrayProgress, TRAY_SEGMENTS } from "@/tray/progress";
import type { UploadItem } from "./use-uploads";

/** Blocos cheios (1 a 4) do progresso geral, ou null se não há envio em andamento. */
function trayLevel(items: UploadItem[]) {
	const active = items.filter(
		(item) => item.status === "queued" || item.status === "uploading",
	);
	if (active.length === 0) return null;

	const total = active.reduce((sum, item) => sum + item.size, 0);
	const loaded = active.reduce(
		(sum, item) => sum + (item.size * item.progress) / 100,
		0,
	);
	const fraction = total === 0 ? 0 : loaded / total;

	// Começar já mostra o primeiro bloco, para o usuário ver que algo está rolando.
	return Math.min(
		TRAY_SEGMENTS,
		Math.max(1, Math.ceil(fraction * TRAY_SEGMENTS)),
	);
}

/** Espelha o progresso dos uploads no ícone da bandeja. */
export function useTrayProgress(items: UploadItem[]) {
	const level = trayLevel(items);

	useEffect(() => {
		setTrayProgress(level).catch(console.error);
	}, [level]);
}
