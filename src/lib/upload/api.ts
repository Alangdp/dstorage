import axios from "axios";
import { t } from "@/i18n";
import { api, post, toError } from "@/lib/http";

// Contract with the backend that talks to S3. The app never sees AWS credentials:
// the backend creates the multipart upload and returns one presigned URL per part.

/** A part already uploaded, as S3 expects it in CompleteMultipartUpload. */
export type CompletedPart = { PartNumber: number; ETag: string };

/** CreateMultipartUpload on the backend. */
export function startUpload(file: {
	name: string;
	type: string;
	size: number;
}) {
	return post<{ key: string; uploadId: string }>("/uploads/start", file);
}

/** Presigned UploadPart (PUT) URL for one part. */
export async function getPartUrl(
	key: string,
	uploadId: string,
	partNumber: number,
) {
	const { url } = await post<{ url: string }>("/uploads/part-url", {
		key,
		uploadId,
		partNumber,
	});
	return url;
}

/** CompleteMultipartUpload on the backend. */
export function completeUpload(
	key: string,
	uploadId: string,
	parts: CompletedPart[],
) {
	return post<{ key: string }>("/uploads/complete", { key, uploadId, parts });
}

/** AbortMultipartUpload on the backend, so orphaned parts are not billed by S3. */
export function abortUpload(key: string, uploadId: string) {
	return post<unknown>("/uploads/abort", { key, uploadId });
}

/** A presigned link to download an uploaded file. */
export type DownloadLink = {
	url: string;
	/** When the link stops working (ms since the epoch). */
	linkExpiresAt: number;
	/** When the server is due to delete the file (the server's fixed retention). */
	fileExpiresAt: number;
};

/** The file no longer exists on S3 (for example, deleted by the retention rule). */
export class FileGoneError extends Error {
	constructor() {
		super(t("error.fileGone"));
	}
}

/**
 * Presigned (GET) link to download/share an uploaded file.
 * @throws {FileGoneError} When the file is past the server's retention period.
 */
export async function getDownloadLink(
	key: string,
	expiresHours: number,
): Promise<DownloadLink> {
	try {
		const { data } = await api.post<{
			url: string;
			expiresAt: string;
			fileExpiresAt: string;
		}>("/uploads/download-url", { key, expiresHours });

		return {
			url: data.url,
			linkExpiresAt: Date.parse(data.expiresAt),
			fileExpiresAt: Date.parse(data.fileExpiresAt),
		};
	} catch (error) {
		if (axios.isAxiosError(error) && error.response?.status === 410) {
			throw new FileGoneError();
		}
		throw toError(error);
	}
}
