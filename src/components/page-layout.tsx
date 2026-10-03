import { ArrowLeft, X } from "lucide-react";
import type { ReactNode } from "react";
import { HeaderButton } from "@/components/header-button";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

type PageLayoutProps = {
	title: ReactNode;
	/** Shows a back arrow on the left when given. */
	onBack?: () => void;
	/** Closes the window (hides it in the tray); drives the X on the right. */
	onClose: () => void;
	/** Extra header buttons, shown to the left of the close button. */
	actions?: ReactNode;
	/** Fixed bar under the content (for example Save/Cancel). */
	footer?: ReactNode;
	/** Whether the content may scroll. When false it is clipped, so it must fit. Defaults to true. */
	scroll?: boolean;
	/** Extra classes for the content area. */
	className?: string;
	children: ReactNode;
};

/**
 * The standard screen: header (optional back arrow, title, actions, close), content and
 * an optional footer. Every full-window screen of the app is built on it.
 */
export function PageLayout({
	title,
	onBack,
	onClose,
	actions,
	footer,
	scroll = true,
	className,
	children,
}: PageLayoutProps) {
	const { t } = useI18n();

	return (
		<div className="flex h-screen flex-col bg-background text-foreground">
			<header className="flex h-12 shrink-0 items-center justify-between border-b px-4">
				<div className="flex items-center gap-2">
					{onBack && (
						<HeaderButton label={t("common.back")} onClick={onBack}>
							<ArrowLeft />
						</HeaderButton>
					)}
					<h1 className="flex items-center gap-2 text-sm font-semibold">
						{title}
					</h1>
				</div>

				<div className="flex items-center gap-1">
					{actions}
					<HeaderButton label={t("common.close")} onClick={onClose}>
						<X />
					</HeaderButton>
				</div>
			</header>

			<main
				className={cn(
					"flex flex-1 flex-col gap-4 p-4",
					scroll ? "overflow-y-auto" : "overflow-hidden",
					className,
				)}
			>
				{children}
			</main>

			{footer && (
				<footer className="flex shrink-0 flex-col gap-2 border-t p-4">
					{footer}
				</footer>
			)}
		</div>
	);
}
