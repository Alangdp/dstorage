import { useCallback, useEffect, useRef, useState } from "react";
import { t } from "@/i18n";
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

/** Where an upload is in its life cycle. */
export type UploadStatus =
	| "queued"
	| "uploading"
	| "done"
	| "error"
	| "canceled";

/** One file in the upload queue/history. */
export type UploadItem = {
	id: string;
	name: string;
	size: number;
	/** 0 to 100 */
	progress: number;
	status: UploadStatus;
	error?: string;

	/** The object's key on S3, available after the upload. */
	key?: string;
	/** When the item entered the queue. */
	createdAt?: number;
	uploadedAt?: number;
	/** The latest presigned link generated. */
	url?: string;
	linkExpiresAt?: number;
	/** When S3 is due to delete the file (if retention is on). */
	fileExpiresAt?: number;
	/** S3 confirmed the file no longer exists. */
	deleted?: boolean;
	/** The link is on the clipboard. */
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

/**
 * Upload queue (starts on its own) plus the history of finished uploads.
 * @returns The items and the actions to add files, cancel, copy a link and remove an item.
 */
export function useUploads() {
	const [items, setItems] = useState<UploadItem[]>(loadHistory);
	const controllers = useRef(new Map<string, AbortController>());
	const queue = useRef<Array<() => Promise<void>>>([]);
	const running = useRef(0);

	// Persist only when something in the history changes, not on every progress tick.
	// The signature uses the status (not the progress), which changes few times per item.
	const historySignature = items
		.map(
			(item) =>
				`${item.id}:${item.status}:${item.url}:${item.linkExpiresAt}:${item.deleted}`,
		)
		.join("|");
	// biome-ignore lint/correctness/useExhaustiveDependencies: the signature stands for `items`
	useEffect(() => {
		saveHistory(items);
	}, [historySignature]);

	const patch = useCallback((id: string, changes: Partial<UploadItem>) => {
		setItems((prev) =>
			prev.map((item) => (item.id === id ? { ...item, ...changes } : item)),
		);
	}, []);

	/** Asks the backend for a new link and copies it. Marks the item deleted if S3 no longer has the file. */
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
					console.error("Failed to generate the download link", error);
				}
			}
		},
		[patch],
	);

	const pump = useCallback(() => {
		while (running.current < FILE_CONCURRENCY && queue.current.length > 0) {
			const job = queue.current.shift();
			if (!job) {
				break;
			}
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
					if (controller.signal.aborted) {
						return;
					}
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

						// The upload already succeeded: failing to generate the link is not a file error.
						await refreshLink(id, key);
						void notifyIfHidden(t("notify.uploadDone"), file.name);
					} catch (error) {
						if (controller.signal.aborted) {
							return;
						}
						const message =
							error instanceof Error ? error.message : String(error);
						void notifyIfHidden(
							t("notify.uploadFailed"),
							`${file.name}: ${message}`,
						);
						patch(id, { status: "error", error: message });
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

	/** Copies the link; if it has expired, generates another first (while the file exists). */
	const copyLink = useCallback(
		async (id: string) => {
			const item = items.find((candidate) => candidate.id === id);
			if (!item?.key) {
				return;
			}

			const state = getLinkState(item, Date.now());
			if (state === "file-deleted") {
				return;
			}

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
