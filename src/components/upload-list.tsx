import {
	Check,
	CircleAlert,
	CircleCheck,
	Clock,
	File,
	Link,
	RefreshCw,
	Trash2,
	X,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { UploadItem } from "@/hooks/use-uploads";
import { useI18n } from "@/i18n";
import { formatDateTime, getLinkState, type LinkState } from "@/lib/link-state";
import { cn } from "@/lib/utils";

/** Formats a byte count with the largest unit that keeps the number below 1024. */
function formatBytes(bytes: number) {
	if (bytes < 1024) {
		return `${bytes} B`;
	}
	const units = ["KB", "MB", "GB", "TB"];
	let value = bytes / 1024;
	let unit = 0;
	while (value >= 1024 && unit < units.length - 1) {
		value /= 1024;
		unit++;
	}
	return `${value.toFixed(1)} ${units[unit]}`;
}

/** The line of text under an item that describes what is going on with it. */
function useStatusLabel() {
	const { t } = useI18n();

	const withDate = (label: string, item: UploadItem) =>
		item.createdAt ? `${label} · ${formatDateTime(item.createdAt)}` : label;

	return (item: UploadItem, now: number) => {
		switch (item.status) {
			case "queued":
				return t("list.queued");
			case "uploading":
				return `${Math.round(item.progress)}%`;
			case "canceled":
				return withDate(t("list.canceled"), item);
			case "error":
				return withDate(item.error ?? t("list.errorFallback"), item);
			case "done": {
				if (!item.url && !item.deleted) {
					return t("list.generatingLink");
				}
				const state = getLinkState(item, now);
				if (state === "file-deleted") {
					return t("list.fileDeleted");
				}
				if (state === "link-expired") {
					return t("list.linkExpired");
				}

				const parts = [
					t("list.linkValidUntil", {
						date: formatDateTime(item.linkExpiresAt ?? now),
					}),
				];
				if (item.copied) {
					parts.unshift(t("list.copied"));
				}
				if (item.fileExpiresAt) {
					parts.push(
						t("list.fileDeletedAt", {
							date: formatDateTime(item.fileExpiresAt),
						}),
					);
				}
				return parts.join(" · ");
			}
		}
	};
}

type StatusIconProps = {
	item: UploadItem;
	state: LinkState;
};

function StatusIcon({ item, state }: StatusIconProps) {
	if (item.status === "error") {
		return <CircleAlert className="size-4 shrink-0 text-destructive" />;
	}
	if (item.status === "done") {
		if (state === "file-deleted") {
			return <Trash2 className="size-4 shrink-0 text-muted-foreground" />;
		}
		if (state === "link-expired") {
			return <Clock className="size-4 shrink-0 text-amber-500" />;
		}
		return <CircleCheck className="size-4 shrink-0 text-green-600" />;
	}
	return <File className="size-4 shrink-0 text-muted-foreground" />;
}

type IconButtonProps = {
	label: string;
	icon: ReactNode;
	onClick: () => void;
};

/** A small ghost icon button with a tooltip (the label doubles as the accessible name). */
function IconButton({ label, icon, onClick }: IconButtonProps) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="ghost"
					size="icon-xs"
					aria-label={label}
					onClick={onClick}
				>
					{icon}
				</Button>
			</TooltipTrigger>
			<TooltipContent>{label}</TooltipContent>
		</Tooltip>
	);
}

type UploadListProps = {
	/** Items to show, in the order they should appear. */
	items: UploadItem[];
	/** The current time, so link states stay in sync with the rest of the screen. */
	now: number;
	/** One line per status (cut with an ellipsis; the full text is in the tooltip). */
	compact?: boolean;
	onCancel: (id: string) => void;
	onCopyLink: (id: string) => void;
	onRemove: (id: string) => void;
};

/** A plain list of uploads (no filtering, no scrolling): the caller decides what to show. */
export function UploadList({
	items,
	now,
	compact = false,
	onCancel,
	onCopyLink,
	onRemove,
}: UploadListProps) {
	const { t } = useI18n();
	const statusLabel = useStatusLabel();

	return (
		<ul className="flex flex-col gap-3">
			{items.map((item) => {
				const active = item.status === "queued" || item.status === "uploading";
				const finished = item.status === "done";
				const state = getLinkState(item, now);

				return (
					<li key={item.id} className="flex flex-col gap-1.5">
						<div className="flex items-center gap-2">
							<StatusIcon item={item} state={state} />

							<span
								className="min-w-0 flex-1 truncate text-sm"
								title={item.name}
							>
								{item.name}
							</span>
							<span className="shrink-0 text-xs text-muted-foreground">
								{formatBytes(item.size)}
							</span>

							{finished && item.key && state !== "file-deleted" && (
								<IconButton
									label={
										state === "link-expired"
											? t("list.actionRegenerate")
											: item.copied
												? t("list.actionCopied")
												: t("list.actionCopy")
									}
									icon={
										state === "link-expired" ? (
											<RefreshCw />
										) : item.copied ? (
											<Check />
										) : (
											<Link />
										)
									}
									onClick={() => onCopyLink(item.id)}
								/>
							)}

							{active ? (
								<IconButton
									label={t("list.actionCancel", { name: item.name })}
									icon={<X />}
									onClick={() => onCancel(item.id)}
								/>
							) : (
								<IconButton
									label={t("list.actionRemove")}
									icon={<X />}
									onClick={() => onRemove(item.id)}
								/>
							)}
						</div>

						{item.status === "uploading" && <Progress value={item.progress} />}

						<p
							className={cn(
								"text-xs",
								item.status === "error"
									? "text-destructive"
									: "text-muted-foreground",
								compact && "truncate",
							)}
							title={statusLabel(item, now)}
						>
							{statusLabel(item, now)}
						</p>
					</li>
				);
			})}
		</ul>
	);
}
