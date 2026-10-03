import { useCallback, useEffect, useRef, useState } from "react";
import { copyToClipboard } from "@/lib/clipboard";
import { loadHistory, saveHistory } from "@/lib/history";
import { getLinkState } from "@/lib/link-state";
import { notifyIfHidden } from "@/lib/notify";
import { loadSettings } from "@/lib/settings";
import {
	type DownloadLink,
	FileGoneError,
	getDownloadLink,
} from "@/lib/upload/api";
import { uploadFile } from "@/lib/upload/multipart";

export type UploadStatus =
	| "queued"
	| "uploading"
	| "done"
	| "error"
	| "canceled";

export type UploadItem = {
	id: string;
	name: string;
	size: number;
	/** 0 a 100 */
	progress: number;
	status: UploadStatus;
	error?: string;

	/** Chave do objeto no S3, disponível depois do envio. */
	key?: string;
	/** Quando o item entrou na fila. */
	createdAt?: number;
	uploadedAt?: number;
	/** Último link pré-assinado gerado. */
	url?: string;
	linkExpiresAt?: number;
	/** Quando o S3 deve apagar o arquivo (se a retenção estiver ligada). */
	fileExpiresAt?: number;
	/** O S3 confirmou que o arquivo não existe mais. */
	deleted?: boolean;
	/** O link está na área de transferência. */
	copied?: boolean;
};

const FILE_CONCURRENCY = 2;

function linkFields(link: DownloadLink): Partial<UploadItem> {
	return {
		url: link.url,
		linkExpiresAt: link.linkExpiresAt,
		fileExpiresAt: link.fileExpiresAt,
	};
}

/** Fila de uploads (começa sozinha) + histórico dos enviados. */
export function useUploads() {
	const [items, setItems] = useState<UploadItem[]>(loadHistory);
	const controllers = useRef(new Map<string, AbortController>());
	const queue = useRef<Array<() => Promise<void>>>([]);
	const running = useRef(0);

	// Persiste só quando algo do histórico muda, não a cada tick de progresso.
	// A assinatura usa o status (não o progresso), que muda poucas vezes por item.
	const historySignature = items
		.map(
			(item) =>
				`${item.id}:${item.status}:${item.url}:${item.linkExpiresAt}:${item.deleted}`,
		)
		.join("|");
	// biome-ignore lint/correctness/useExhaustiveDependencies: a assinatura representa `items`
	useEffect(() => {
		saveHistory(items);
	}, [historySignature]);

	const patch = useCallback((id: string, changes: Partial<UploadItem>) => {
		setItems((prev) =>
			prev.map((item) => (item.id === id ? { ...item, ...changes } : item)),
		);
	}, []);

	/** Pede um link novo ao backend e copia. Marca o item como apagado se o S3 não tem mais o arquivo. */
	const refreshLink = useCallback(
		async (id: string, key: string) => {
			try {
				const link = await getDownloadLink(
					key,
					loadSettings().linkExpiresHours,
				);
				patch(id, {
					...linkFields(link),
					copied: await copyToClipboard(link.url),
				});
			} catch (error) {
				if (error instanceof FileGoneError) {
					patch(id, { deleted: true, copied: false });
				} else {
					console.error("Falha ao gerar o link de download", error);
				}
			}
		},
		[patch],
	);

	const pump = useCallback(() => {
		while (running.current < FILE_CONCURRENCY && queue.current.length > 0) {
			const job = queue.current.shift();
			if (!job) break;
			running.current++;
			void job().finally(() => {
				running.current--;
				pump();
			});
		}
	}, []);

	const addFiles = useCallback(
		(files: File[]) => {
			for (const file of files) {
				const id = crypto.randomUUID();
				const controller = new AbortController();
				controllers.current.set(id, controller);

				setItems((prev) => [
					...prev,
					{
						id,
						name: file.name,
						size: file.size,
						progress: 0,
						status: "queued",
						createdAt: Date.now(),
					},
				]);

				queue.current.push(async () => {
					if (controller.signal.aborted) return;
					patch(id, { status: "uploading" });
					try {
						const key = await uploadFile(file, {
							signal: controller.signal,
							onProgress: (loaded, total) =>
								patch(id, {
									progress: total === 0 ? 100 : (loaded / total) * 100,
								}),
						});
						patch(id, {
							status: "done",
							progress: 100,
							key,
							uploadedAt: Date.now(),
						});

						// O upload já deu certo: falhar em gerar o link não vira erro do arquivo.
						await refreshLink(id, key);
						void notifyIfHidden("Upload concluído", file.name);
					} catch (error) {
						if (controller.signal.aborted) return;
						const message =
							error instanceof Error ? error.message : String(error);
						void notifyIfHidden("Falha no upload", `${file.name}: ${message}`);
						patch(id, {
							status: "error",
							error: message,
						});
					} finally {
						controllers.current.delete(id);
					}
				});
			}
			pump();
		},
		[patch, pump, refreshLink],
	);

	const cancel = useCallback(
		(id: string) => {
			controllers.current.get(id)?.abort();
			patch(id, { status: "canceled" });
		},
		[patch],
	);

	/** Copia o link; se já venceu, gera outro antes (enquanto o arquivo existir). */
	const copyLink = useCallback(
		async (id: string) => {
			const item = items.find((candidate) => candidate.id === id);
			if (!item?.key) return;

			const state = getLinkState(item, Date.now());
			if (state === "file-deleted") return;

			if (state === "valid" && item.url) {
				patch(id, { copied: await copyToClipboard(item.url) });
				return;
			}
			await refreshLink(id, item.key);
		},
		[items, patch, refreshLink],
	);

	const remove = useCallback((id: string) => {
		setItems((prev) => prev.filter((item) => item.id !== id));
	}, []);

	return { items, addFiles, cancel, copyLink, remove };
}
