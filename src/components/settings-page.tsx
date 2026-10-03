import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";
import { useEffect, useState } from "react";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	type LanguageSetting,
	type MessageKey,
	setLanguage,
	useI18n,
} from "@/i18n";
import {
	isValidLinkHours,
	loadSettings,
	MAX_LINK_EXPIRES_HOURS,
	MIN_LINK_EXPIRES_HOURS,
	saveSettings,
} from "@/lib/settings";

const LANGUAGE_OPTIONS: Array<{ value: LanguageSetting; label: MessageKey }> = [
	{ value: "system", label: "settings.languageSystem" },
	{ value: "en", label: "settings.languageEn" },
	{ value: "pt", label: "settings.languagePt" },
];

type SettingsPageProps = {
	/** Goes back to the main screen without saving. */
	onBack: () => void;
	/** Closes the window (hides it in the tray). */
	onClose: () => void;
};

/** Settings screen. Nothing is applied until the user presses Save. */
export function SettingsPage({ onBack, onClose }: SettingsPageProps) {
	const { t } = useI18n();
	// Kept as text so the user can erase and retype freely.
	const [hours, setHours] = useState(() =>
		String(loadSettings().linkExpiresHours),
	);
	const [language, setLanguageChoice] = useState<LanguageSetting>(
		() => loadSettings().language,
	);
	const [autostart, setAutostart] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		// The source of truth is the operating system, not localStorage.
		isEnabled()
			.then(setAutostart)
			.catch(() => setAutostart(false));
	}, []);

	async function handleSave() {
		const value = Number(hours);
		if (!isValidLinkHours(value)) {
			setError(
				t("settings.errorHours", {
					min: MIN_LINK_EXPIRES_HOURS,
					max: MAX_LINK_EXPIRES_HOURS,
				}),
			);
			return;
		}

		try {
			saveSettings({
				...loadSettings(),
				linkExpiresHours: value,
				language,
			});
		} catch {
			setError(t("settings.errorSave"));
			return;
		}

		try {
			if (autostart !== (await isEnabled())) {
				await (autostart ? enable() : disable());
			}
		} catch {
			setError(t("settings.errorAutostart"));
			return;
		}

		setLanguage(language);
		onBack();
	}

	return (
		<PageLayout
			title={t("settings.title")}
			onBack={onBack}
			onClose={onClose}
			className="gap-6"
			footer={
				<>
					{error && <p className="text-sm text-destructive">{error}</p>}
					<div className="flex justify-end gap-2">
						<Button variant="outline" onClick={onBack}>
							{t("common.cancel")}
						</Button>
						<Button onClick={handleSave}>{t("common.save")}</Button>
					</div>
				</>
			}
		>
			<section className="flex flex-col gap-1.5">
				<Label htmlFor="link-hours">{t("settings.linkHours")}</Label>
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

			<section className="flex flex-col gap-1.5">
				<Label htmlFor="language">{t("settings.language")}</Label>
				<Select
					value={language}
					onValueChange={(value) => setLanguageChoice(value as LanguageSetting)}
				>
					<SelectTrigger id="language" className="w-full">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{LANGUAGE_OPTIONS.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{t(option.label)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
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
					<Label htmlFor="autostart">{t("settings.autostart")}</Label>
					<p className="text-xs text-muted-foreground">
						{t("settings.autostartHint")}
					</p>
				</div>
			</section>
		</PageLayout>
	);
}
