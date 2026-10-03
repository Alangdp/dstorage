import type { UploadItem } from "@/hooks/use-uploads";
import { getLocale } from "@/i18n";

/** What can be done with an uploaded file's share link. */
export type LinkState =
	| "valid" // can be downloaded right now
	| "link-expired" // the link expired, but the file still exists so a new one can be made
	| "file-deleted"; // the file is gone from S3

/** Works out the state of an item's link at the instant `now` (ms since the epoch). */
export function getLinkState(item: UploadItem, now: number): LinkState {
	if (item.deleted) {
		return "file-deleted";
	}
	if (item.fileExpiresAt !== undefined && now >= item.fileExpiresAt) {
		return "file-deleted";
	}
	if (item.linkExpiresAt === undefined || now >= item.linkExpiresAt) {
		return "link-expired";
	}
	return "valid";
}

/** Formats a timestamp as a short day/month and time, in the current language. */
export function formatDateTime(timestamp: number) {
	return new Intl.DateTimeFormat(getLocale(), {
		day: "2-digit",
		month: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	}).format(timestamp);
}
