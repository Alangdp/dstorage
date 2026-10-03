import axios, { type AxiosResponse } from "axios";
import { t } from "@/i18n";
import {
	abortUpload,
	type CompletedPart,
	completeUpload,
	getPartUrl,
	startUpload,
} from "./api";

const MIN_PART_SIZE = 8 * 1024 * 1024; // S3 requires at least 5 MiB (except the last part)
const MAX_PARTS = 10_000; // S3 limit
const PART_CONCURRENCY = 3;
const PART_RETRIES = 3;

/** Options for {@link uploadFile}. */
type UploadOptions = {
	/** Aborting it cancels the upload and cleans up the parts already sent. */
	signal: AbortSignal;
	/** Called as bytes are sent; `loaded` is the running total across all parts. */
	onProgress: (loaded: number, total: number) => void;
};

function partSizeFor(fileSize: number) {
	return Math.max(MIN_PART_SIZE, Math.ceil(fileSize / MAX_PARTS));
}

/**
 * PUTs one part to its presigned URL.
 * The body is a sliced Blob (`File.slice`), which the browser reads from disk on demand.
 * @returns The part's ETag.
 */
async function putPart(
	url: string,
	body: Blob,
	signal: AbortSignal,
	onProgress: (loaded: number) => void,
): Promise<string> {
	let response: AxiosResponse;
	try {
		// Plain axios (no backend baseURL): the presigned URL is already complete.
		response = await axios.put(url, body, {
			signal,
			headers: { "Content-Type": "application/octet-stream" },
			onUploadProgress: (event) => onProgress(event.loaded),
		});
	} catch (error) {
		// Without a `response` the browser blocked the request, almost always because of CORS.
		if (
			axios.isAxiosError(error) &&
			!axios.isCancel(error) &&
			!error.response
		) {
			throw new Error(t("error.partNetwork"));
		}
		throw error;
	}

	// Requires `ExposeHeaders: ETag` in the bucket CORS.
	const etag = response.headers.etag;
	if (typeof etag !== "string" || etag === "") {
		throw new Error(t("error.noEtag"));
	}
	return etag;
}

/**
 * Uploads a file to S3 in parts (multipart), at most `PART_CONCURRENCY` at a time,
 * so only a few parts are in memory at once.
 * @returns The object key on S3.
 */
export async function uploadFile(file: File, options: UploadOptions) {
	const { signal, onProgress } = options;

	const { key, uploadId } = await startUpload({
		name: file.name,
		type: file.type || "application/octet-stream",
		size: file.size,
	});

	// Aborts the in-flight parts if one of them fails for good.
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
					// The URL is requested on every attempt: presigned URLs expire.
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
					if (inner.signal.aborted || attempt >= PART_RETRIES) {
						throw error;
					}
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
