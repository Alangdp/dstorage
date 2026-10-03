import { getCurrentWindow } from "@tauri-apps/api/window";
import { CloudUpload, Moon, Settings, Sun, Upload, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Dropzone, DropzoneEmptyState } from "@/components/kibo-ui/dropzone";
import { SettingsPage } from "@/components/settings-page";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { UploadList } from "@/components/upload-list";
import { useTrayProgress } from "@/hooks/use-tray-progress";
import { useUploads } from "@/hooks/use-uploads";
import { toggleTheme, useIsDark } from "@/lib/theme";

function hideWindow() {
	getCurrentWindow().hide().catch(console.error);
}

function App() {
	const { items, addFiles, cancel, copyLink, remove } = useUploads();
	const [view, setView] = useState<"main" | "settings">("main");
	useTrayProgress(items);
	const dark = useIsDark();

	// Esc esconde a janela no tray, em qualquer tela.
	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") hideWindow();
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, []);

	return (
		<TooltipProvider>
			{view === "settings" ? (
				<SettingsPage onBack={() => setView("main")} onClose={hideWindow} />
			) : (
				<div className="flex h-screen flex-col bg-background text-foreground">
					<header className="flex h-12 shrink-0 items-center justify-between border-b px-4">
						<h1 className="flex items-center gap-2 text-sm font-semibold">
							<CloudUpload className="size-5 text-primary" />
							dstorage
						</h1>

						<div className="flex items-center gap-1">
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										aria-label={dark ? "Tema claro" : "Tema escuro"}
										onClick={toggleTheme}
									>
										{dark ? <Sun /> : <Moon />}
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									{dark ? "Tema claro" : "Tema escuro"}
								</TooltipContent>
							</Tooltip>

							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										aria-label="Configurações"
										onClick={() => setView("settings")}
									>
										<Settings />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Configurações</TooltipContent>
							</Tooltip>

							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										aria-label="Close"
										onClick={hideWindow}
									>
										<X />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Close</TooltipContent>
							</Tooltip>
						</div>
					</header>

					<main className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
						<Dropzone
							maxFiles={0}
							onDrop={(accepted) => addFiles(accepted)}
							className="h-48 shrink-0"
						>
							<DropzoneEmptyState>
								<div className="flex flex-col items-center gap-2">
									<Upload className="size-8 text-muted-foreground" />
									<p className="text-sm font-medium">Arraste arquivos aqui</p>
									<p className="text-xs text-muted-foreground">
										O envio começa automaticamente
									</p>
								</div>
							</DropzoneEmptyState>
						</Dropzone>

						<UploadList
							items={items}
							onCancel={cancel}
							onCopyLink={copyLink}
							onRemove={remove}
						/>
					</main>
				</div>
			)}
		</TooltipProvider>
	);
}

export default App;
