import { defaultWindowIcon, exit } from "@tauri-apps/api/app";
import { Menu, MenuItem } from "@tauri-apps/api/menu";
import { TrayIcon } from "@tauri-apps/api/tray";
import { openMainWindow, toggleMainWindow } from "./window";

const TRAY_ID = "main-tray";

let tray: TrayIcon | null = null;

/** O tray criado por `setupTray`, ou null enquanto ele ainda não existe. */
export function getTray() {
	return tray;
}

export async function setupTray() {
	// No dev, cada reload do webview deixaria um tray antigo com callbacks mortos.
	await TrayIcon.removeById(TRAY_ID).catch(() => {});

	// O item precisa ser criado com MenuItem.new (e não inline em Menu.new({ items })):
	// no Tauri, itens inline têm o canal do `action` removido logo após a criação,
	// e o clique chega ao Rust mas nunca ao JS.
	const quit = await MenuItem.new({
		id: "quit",
		text: "Quit",
		action: () => {
			void exit(0);
		},
	});

	// No Linux o tray não emite cliques, então o menu é o único caminho para abrir a janela.
	const open = await MenuItem.new({
		id: "open",
		text: "Open",
		action: () => {
			void openMainWindow().catch(console.error);
		},
	});

	const menu = await Menu.new({ items: [open, quit] });

	tray = await TrayIcon.new({
		id: TRAY_ID,
		icon: (await defaultWindowIcon()) ?? undefined,
		menu,
		// Clique esquerdo alterna a janela; o menu fica no botão direito.
		showMenuOnLeftClick: false,
		action: (event) => {
			// Click dispara em Down e Up; só reage uma vez.
			if (
				event.type === "Click" &&
				event.button === "Left" &&
				event.buttonState === "Up"
			) {
				void toggleMainWindow(event.rect).catch(console.error);
			}
		},
	});
}
