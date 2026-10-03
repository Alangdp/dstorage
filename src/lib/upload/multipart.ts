import axios, { type AxiosResponse } from "axios";
import {
	abortUpload,
	type CompletedPart,
	completeUpload,
	getPartUrl,
	startUpload,
} from "./api";

const MIN_PART_SIZE = 8 * 1024 * 1024; // o S3 exige no mínimo 5 MiB (exceto a última)
const MAX_PARTS = 10_000; // limite do S3
const PART_CONCURRENCY = 3;
const PART_RETRIES = 3;

type UploadOptions = {
	signal: AbortSignal;
	onProgress: (loaded: number, total: number) => void;
};

function partSizeFor(fileSize: number) {
	return Math.max(MIN_PART_SIZE, Math.ceil(fileSize / MAX_PARTS));
}

// O corpo é um Blob fatiado (`File.slice`), que o navegador lê do disco sob demanda.
async function putPart(
	url: string,
	body: Blob,
	signal: AbortSignal,
	onProgress: (loaded: number) => void,
): Promise<string> {
	let response: AxiosResponse;
	try {
		// axios puro (sem baseURL do backend): a URL pré-assinada já é completa.
		response = await axios.put(url, body, {
			signal,
			headers: { "Content-Type": "application/octet-stream" },
			onUploadProgress: (event) => onProgress(event.loaded),
		});
	} catch (error) {
		// Sem `response`, o navegador bloqueou a requisição, quase sempre por CORS.
		if (
			axios.isAxiosError(error) &&
			!axios.isCancel(error) &&
			!error.response
		) {
			throw new Error(
				"Falha de rede ao enviar parte ao S3 (confira o CORS e a região do bucket)",
			);
		}
		throw error;
	}

	// Exige `ExposeHeaders: ETag` no CORS do bucket.
	const etag = response.headers.etag;
	if (typeof etag !== "string" || etag === "") {
		throw new Error("S3 não devolveu ETag (veja o CORS do bucket)");
	}
	return etag;
}

/**
 * Envia um arquivo ao S3 em partes (multipart), no máximo `PART_CONCURRENCY`
 * ao mesmo tempo, então só algumas partes ficam em memória por vez.
 */
export async function uploadFile(file: File, options: UploadOptions) {
	const { signal, onProgress } = options;

	const { key, uploadId } = await startUpload({
		name: file.name,
		type: file.type || "application/octet-stream",
		size: file.size,
	});

	// Aborta as partes em voo se uma delas falhar de vez.
	const inner = new AbortController();
	const forward = () => inner.abort(signal.reason);
	signal.addEventListener("abort", forward, { once: true });

	try {
		const partSize = partSizeFor(file.size);
		const partCount = Math.max(1, Math.ceil(file.size / partSize));
		const loadedByPart = new Array<number>(partCount).fill(0);
		const parts: CompletedPart[] = new Array(partCount);
		let nextPart = 0;

		const report = () =>
			onProgress(
				loadedByPart.reduce((sum, loaded) => sum + loaded, 0),
				file.size,
			);

		const uploadPart = async (index: number) => {
			const blob = file.slice(index * partSize, (index + 1) * partSize);

			for (let attempt = 1; ; attempt++) {
				try {
					// A URL é pedida a cada tentativa: pré-assinadas expiram.
					const url = await getPartUrl(key, uploadId, index + 1);
					const etag = await putPart(url, blob, inner.signal, (loaded) => {
						loadedByPart[index] = loaded;
						report();
					});
					loadedByPart[index] = blob.size;
					report();
					return { PartNumber: index + 1, ETag: etag };
				} catch (error) {
					loadedByPart[index] = 0;
					if (inner.signal.aborted || attempt >= PART_RETRIES) throw error;
				}
			}
		};

		const worker = async () => {
			while (nextPart < partCount) {
				const index = nextPart++;
				parts[index] = await uploadPart(index);
			}
		};

		try {
			await Promise.all(
				Array.from({ length: Math.min(PART_CONCURRENCY, partCount) }, worker),
			);
		} catch (error) {
			inner.abort(error);
			throw error;
		}

		await completeUpload(key, uploadId, parts);
		return key;
	} catch (error) {
		await abortUpload(key, uploadId).catch(() => {});
		throw error;
	} finally {
		signal.removeEventListener("abort", forward);
	}
}
