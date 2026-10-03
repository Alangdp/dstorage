import { useState } from "react";
import { PageLayout } from "@/components/page-layout";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadList } from "@/components/upload-list";
import { useNow } from "@/hooks/use-now";
import type { UploadItem } from "@/hooks/use-uploads";
import { type MessageKey, useI18n } from "@/i18n";
import { getLinkState } from "@/lib/link-state";

type Filter = "all" | "active" | "expired" | "failed";

const FILTERS: Array<{ value: Filter; label: MessageKey }> = [
	{ value: "all", label: "list.filterAll" },
	{ value: "active", label: "list.filterActive" },
	{ value: "expired", label: "list.filterExpired" },
	{ value: "failed", label: "list.filterFailed" },
];

/** Which tab an item shows up in (besides "All"). */
function categoryOf(item: UploadItem, now: number): Exclude<Filter, "all"> {
	if (item.status === "error" || item.status === "canceled") {
		return "failed";
	}
	if (item.status === "done") {
		return getLinkState(item, now) === "valid" ? "active" : "expired";
	}
	return "active"; // queued or uploading
}

type HistoryPageProps = {
	/** Every upload, oldest first. */
	items: UploadItem[];
	onBack: () => void;
	onClose: () => void;
	onCancel: (id: string) => void;
	onCopyLink: (id: string) => void;
	onRemove: (id: string) => void;
};

/** The full upload history, newest first, with a filter by state. */
export function HistoryPage({
	items,
	onBack,
	onClose,
	onCancel,
	onCopyLink,
	onRemove,
}: HistoryPageProps) {
	const { t } = useI18n();
	const now = useNow();
	const [filter, setFilter] = useState<Filter>("all");

	const counts: Record<Filter, number> = {
		all: items.length,
		active: 0,
		expired: 0,
		failed: 0,
	};
	for (const item of items) {
		counts[categoryOf(item, now)]++;
	}

	const visible = [...items]
		.reverse()
		.filter((item) => filter === "all" || categoryOf(item, now) === filter);

	return (
		<PageLayout title={t("history.title")} onBack={onBack} onClose={onClose}>
			<Tabs
				value={filter}
				onValueChange={(value) => setFilter(value as Filter)}
			>
				<TabsList className="w-full">
					{FILTERS.map(({ value, label }) => (
						<TabsTrigger key={value} value={value} className="text-xs">
							{t(label)} ({counts[value]})
						</TabsTrigger>
					))}
				</TabsList>
			</Tabs>

			{visible.length === 0 ? (
				<p className="py-4 text-center text-sm text-muted-foreground">
					{t("list.empty")}
				</p>
			) : (
				<UploadList
					items={visible}
					now={now}
					onCancel={onCancel}
					onCopyLink={onCopyLink}
					onRemove={onRemove}
				/>
			)}
		</PageLayout>
	);
}
