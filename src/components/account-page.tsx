import { LogOut, User } from "lucide-react";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { useI18n } from "@/i18n";
import { logout } from "@/lib/auth";

type AccountPageProps = {
	/** Goes back to the main screen. */
	onBack: () => void;
	/** Closes the window (hides it in the tray). */
	onClose: () => void;
};

/** Account screen: who is signed in, and a way to sign out. */
export function AccountPage({ onBack, onClose }: AccountPageProps) {
	const { t } = useI18n();
	const session = useSession();

	async function handleLogout() {
		await logout();
		onBack();
	}

	return (
		<PageLayout
			title={t("account.title")}
			onBack={onBack}
			onClose={onClose}
			footer={
				<Button variant="outline" onClick={handleLogout}>
					<LogOut />
					{t("account.logout")}
				</Button>
			}
		>
			<div className="flex items-center gap-3 rounded-lg border p-3">
				<User className="size-8 text-muted-foreground" />
				<div className="flex min-w-0 flex-col">
					<span className="text-xs text-muted-foreground">
						{t("account.signedInAs")}
					</span>
					<span className="truncate text-sm font-medium">
						{session?.user.email}
					</span>
				</div>
			</div>
		</PageLayout>
	);
}
