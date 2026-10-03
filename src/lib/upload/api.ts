import axios from "axios";
import { api, post, toError } from "@/lib/http";

// Contrato com o backend que fala com o S3. O app nunca vê credenciais da AWS:
// o backend cria o multipart upload e devolve uma URL pré-assinada por parte.

export type CompletedPart = { PartNumber: number; ETag: string };

/** CreateMultipartUpload no backend. */
export function startUpload(file: {
	name: string;
	type: string;
	size: number;
}) {
	return post<{ key: string; uploadId: string }>("/uploads/start", file);
}

/** URL pré-assinada (PUT) de UploadPart para uma parte. */
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

/** CompleteMultipartUpload no backend. */
export function completeUpload(
	key: string,
	uploadId: string,
	parts: CompletedPart[],
) {
	return post<{ key: string }>("/uploads/complete", { key, uploadId, parts });
}

/** AbortMultipartUpload no backend, para não deixar partes órfãs cobrando no S3. */
export function abortUpload(key: string, uploadId: string) {
	return post<unknown>("/uploads/abort", { key, uploadId });
}

export type DownloadLink = {
	url: string;
	/** Quando o link deixa de funcionar (ms desde a época). */
	linkExpiresAt: number;
	/** Quando o servidor deve apagar o arquivo (retenção fixa do servidor). */
	fileExpiresAt: number;
};

/** O arquivo não existe mais no S3 (ex.: apagado pela regra de retenção). */
export class FileGoneError extends Error {
	constructor() {
		super("O arquivo não existe mais no S3");
	}
}

/**
 * Link pré-assinado (GET) para baixar/compartilhar o arquivo já enviado.
 * Falha com `FileGoneError` se o arquivo saiu do prazo de retenção do servidor.
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
