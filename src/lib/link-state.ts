import type { UploadItem } from "@/hooks/use-uploads";

export type LinkState =
	| "valid" // dá para baixar agora
	| "link-expired" // o link venceu, mas o arquivo ainda existe e dá para gerar outro
	| "file-deleted"; // o arquivo saiu do S3

export function getLinkState(item: UploadItem, now: number): LinkState {
	if (item.deleted) return "file-deleted";
	if (item.fileExpiresAt !== undefined && now >= item.fileExpiresAt) {
		return "file-deleted";
	}
	if (item.linkExpiresAt === undefined || now >= item.linkExpiresAt) {
		return "link-expired";
	}
	return "valid";
}

const formatter = new Intl.DateTimeFormat("pt-BR", {
	day: "2-digit",
	month: "2-digit",
	hour: "2-digit",
	minute: "2-digit",
});

export function formatDateTime(timestamp: number) {
	return formatter.format(timestamp);
}
