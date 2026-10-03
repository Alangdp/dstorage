import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";
import { HistoryPage } from "@/components/history-page";
import { MainPage } from "@/components/main-page";
import { SettingsPage } from "@/components/settings-page";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useTrayProgress } from "@/hooks/use-tray-progress";
import { useUploads } from "@/hooks/use-uploads";

type View = "main" | "settings" | "history";

/** Hides the window in the tray (the app keeps running). */
function hideWindow() {
	getCurrentWindow().hide().catch(console.error);
}

/** Root component: owns the upload state and decides which screen is showing. */
export function App() {
	const { items, addFiles, cancel, copyLink, remove } = useUploads();
	const [view, setView] = useState<View>("main");
	useTrayProgress(items);

	// Esc hides the window in the tray, on any screen.
	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				hideWindow();
			}
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, []);

	const goBack = () => setView("main");

	return (
		<TooltipProvider>
			{view === "settings" && (
				<SettingsPage onBack={goBack} onClose={hideWindow} />
			)}
			{view === "history" && (
				<HistoryPage
					items={items}
					onBack={goBack}
					onClose={hideWindow}
					onCancel={cancel}
					onCopyLink={copyLink}
					onRemove={remove}
				/>
			)}
			{view === "main" && (
				<MainPage
					items={items}
					onAddFiles={addFiles}
					onCancel={cancel}
					onCopyLink={copyLink}
					onRemove={remove}
					onOpenSettings={() => setView("settings")}
					onOpenHistory={() => setView("history")}
					onClose={hideWindow}
				/>
			)}
		</TooltipProvider>
	);
}
