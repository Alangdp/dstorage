import { CloudUpload, Moon, Settings, Sun, Upload, User } from "lucide-react";
import { HeaderButton } from "@/components/header-button";
import { Dropzone, DropzoneEmptyState } from "@/components/kibo-ui/dropzone";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { UploadList } from "@/components/upload-list";
import { useNow } from "@/hooks/use-now";
import { useSession } from "@/hooks/use-session";
import type { UploadItem } from "@/hooks/use-uploads";
import { useI18n } from "@/i18n";
import { toggleTheme, useIsDark } from "@/lib/theme";

/**
 * How many recent uploads the main screen shows. The screen never scrolls, so this is
 * what fits under the drop zone with the history button pinned at the bottom, even in
 * the worst case (two uploads in progress, each with a progress bar); the rest is one
 * click away in the history.
 */
export const RECENT_LIMIT = 5;

type MainPageProps = {
	/** Every upload, oldest first. */
	items: UploadItem[];
	onAddFiles: (files: File[]) => void;
	onCancel: (id: string) => void;
	onCopyLink: (id: string) => void;
	onRemove: (id: string) => void;
	/** Opens the account screen when signed in, the sign-in screen otherwise. */
	onOpenAccount: () => void;
	onOpenSettings: () => void;
	onOpenHistory: () => void;
	onClose: () => void;
};

/** The home screen: drop zone, the most recent uploads, and a way into the full history. */
export function MainPage({
	items,
	onAddFiles,
	onCancel,
	onCopyLink,
	onRemove,
	onOpenAccount,
	onOpenSettings,
	onOpenHistory,
	onClose,
}: MainPageProps) {
	const { t } = useI18n();
	const now = useNow();
	const dark = useIsDark();
	const session = useSession();

	const recent = items.slice(-RECENT_LIMIT).reverse();
	const themeLabel = dark ? t("header.themeLight") : t("header.themeDark");
	const accountLabel = session
		? t("header.account", { name: session.user.email })
		: t("header.login");

	return (
		<PageLayout
			scroll={false}
			onClose={onClose}
			title={
				<>
					<CloudUpload className="size-5 text-primary" />
					dstorage
				</>
			}
			actions={
				<>
					<HeaderButton label={themeLabel} onClick={toggleTheme}>
						{dark ? <Sun /> : <Moon />}
					</HeaderButton>
					<HeaderButton label={accountLabel} onClick={onOpenAccount}>
						<User />
					</HeaderButton>
					<HeaderButton label={t("header.settings")} onClick={onOpenSettings}>
						<Settings />
					</HeaderButton>
				</>
			}
		>
			<Dropzone
				maxFiles={0}
				onDrop={(accepted) => onAddFiles(accepted)}
				className="h-32 shrink-0 p-4"
			>
				<DropzoneEmptyState>
					<div className="flex flex-col items-center gap-2">
						<Upload className="size-8 text-muted-foreground" />
						<p className="text-sm font-medium">{t("dropzone.title")}</p>
						<p className="text-xs text-muted-foreground">
							{t("dropzone.hint")}
						</p>
					</div>
				</DropzoneEmptyState>
			</Dropzone>

			<UploadList
				items={recent}
				now={now}
				compact
				onCancel={onCancel}
				onCopyLink={onCopyLink}
				onRemove={onRemove}
			/>

			{items.length > RECENT_LIMIT && (
				<Button
					variant="outline"
					size="sm"
					className="mt-auto shrink-0"
					onClick={onOpenHistory}
				>
					{t("history.viewAll", { count: items.length })}
				</Button>
			)}
		</PageLayout>
	);
}
