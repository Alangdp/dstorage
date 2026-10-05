import { type FormEvent, useState } from "react";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n";
import { login } from "@/lib/auth";

type LoginPageProps = {
	/** Goes back to the main screen. */
	onBack: () => void;
	/** Closes the window (hides it in the tray). */
	onClose: () => void;
	/** Called after a successful sign-in. */
	onSignedIn: () => void;
};

/** Sign-in screen (email and password). */
export function LoginPage({ onBack, onClose, onSignedIn }: LoginPageProps) {
	const { t } = useI18n();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	const canSubmit = email.trim() !== "" && password !== "" && !busy;

	async function handleSubmit(event: FormEvent) {
		event.preventDefault();
		if (!canSubmit) {
			return;
		}
		setBusy(true);
		setError(null);
		try {
			await login(email.trim(), password);
			onSignedIn();
		} catch (e) {
			setError(e instanceof Error ? e.message : t("login.errorFallback"));
			setBusy(false);
		}
	}

	return (
		<PageLayout title={t("login.title")} onBack={onBack} onClose={onClose}>
			<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
				<section className="flex flex-col gap-1.5">
					<Label htmlFor="email">{t("login.email")}</Label>
					<Input
						id="email"
						type="email"
						autoFocus
						autoComplete="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
					/>
				</section>

				<section className="flex flex-col gap-1.5">
					<Label htmlFor="password">{t("login.password")}</Label>
					<Input
						id="password"
						type="password"
						autoComplete="current-password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
					/>
				</section>

				{error && <p className="text-sm text-destructive">{error}</p>}

				<Button type="submit" disabled={!canSubmit}>
					{busy ? t("login.submitting") : t("login.submit")}
				</Button>
			</form>
		</PageLayout>
	);
}
