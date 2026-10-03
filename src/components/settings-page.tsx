import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";
import { ArrowLeft, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	isValidLinkHours,
	loadSettings,
	MAX_LINK_EXPIRES_HOURS,
	MIN_LINK_EXPIRES_HOURS,
	saveSettings,
} from "@/lib/settings";

type SettingsPageProps = {
	/** Volta para a tela principal sem salvar. */
	onBack: () => void;
	/** Fecha a janela (esconde no tray). */
	onClose: () => void;
};

export function SettingsPage({ onBack, onClose }: SettingsPageProps) {
	// Texto, para o usuário poder apagar e redigitar à vontade.
	const [hours, setHours] = useState(() =>
		String(loadSettings().linkExpiresHours),
	);
	const [autostart, setAutostart] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		// A fonte da verdade é o sistema operacional, não o localStorage.
		isEnabled()
			.then(setAutostart)
			.catch(() => setAutostart(false));
	}, []);

	async function handleSave() {
		const value = Number(hours);
		if (!isValidLinkHours(value)) {
			setError(
				`Informe um número inteiro de ${MIN_LINK_EXPIRES_HOURS} a ${MAX_LINK_EXPIRES_HOURS} horas.`,
			);
			return;
		}

		try {
			saveSettings({ ...loadSettings(), linkExpiresHours: value });
		} catch {
			setError("Não foi possível salvar as configurações neste computador.");
			return;
		}

		try {
			if (autostart !== (await isEnabled())) {
				await (autostart ? enable() : disable());
			}
			onBack();
		} catch {
			setError("Não foi possível alterar a inicialização com o sistema.");
		}
	}

	return (
		<div className="flex h-screen flex-col bg-background text-foreground">
			<header className="flex h-12 shrink-0 items-center justify-between border-b px-4">
				<div className="flex items-center gap-2">
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								aria-label="Voltar"
								onClick={onBack}
							>
								<ArrowLeft />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Voltar</TooltipContent>
					</Tooltip>
					<h1 className="text-sm font-semibold">Configurações</h1>
				</div>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							aria-label="Close"
							onClick={onClose}
						>
							<X />
						</Button>
					</TooltipTrigger>
					<TooltipContent>Close</TooltipContent>
				</Tooltip>
			</header>

			<main className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
				<section className="flex flex-col gap-1.5">
					<Label htmlFor="link-hours">Validade do link (horas)</Label>
					<Input
						id="link-hours"
						type="number"
						inputMode="numeric"
						min={MIN_LINK_EXPIRES_HOURS}
						max={MAX_LINK_EXPIRES_HOURS}
						value={hours}
						onChange={(e) => setHours(e.target.value)}
					/>
				</section>

				<section className="flex items-start gap-2">
					<input
						id="autostart"
						type="checkbox"
						className="mt-0.5 size-4 accent-primary"
						checked={autostart}
						onChange={(e) => setAutostart(e.target.checked)}
					/>
					<div className="flex flex-col gap-1">
						<Label htmlFor="autostart">Iniciar com o sistema</Label>
						<p className="text-xs text-muted-foreground">
							Abre o dstorage ao ligar o computador, somente na bandeja.
						</p>
					</div>
				</section>
			</main>

			<footer className="flex shrink-0 flex-col gap-2 border-t p-4">
				{error && <p className="text-sm text-destructive">{error}</p>}
				<div className="flex justify-end gap-2">
					<Button variant="outline" onClick={onBack}>
						Cancelar
					</Button>
					<Button onClick={handleSave}>Salvar</Button>
				</div>
			</footer>
		</div>
	);
}
