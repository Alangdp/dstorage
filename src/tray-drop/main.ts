import { exit } from "@tauri-apps/api/app";
import { emit } from "@tauri-apps/api/event";
import { Menu, MenuItem } from "@tauri-apps/api/menu";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { TRAY_DRAG_ENTER, TRAY_TOGGLE } from "@/tray/events";

// Esta janela cobre o ícone da bandeja; ela só repassa o que acontece sobre ele.

async function trayRect() {
	const win = getCurrentWindow();
	const [position, size] = await Promise.all([
		win.outerPosition(),
		win.outerSize(),
	]);
	return { position, size };
}

// Arrastar um arquivo até o ícone abre a janela principal para receber o drop.
// Vem do evento nativo do Tauri (esta janela mantém o drag-drop do sistema ligado);
// os eventos HTML5 de drag não disparam nesse modo.
getCurrentWebview()
	.onDragDropEvent((event) => {
		if (event.payload.type === "enter") {
			void trayRect().then((rect) => emit(TRAY_DRAG_ENTER, rect));
		}
	})
	.catch(console.error);

document.addEventListener("click", () => {
	void trayRect().then((rect) => emit(TRAY_TOGGLE, rect));
});

// O menu "Quit" do tray fica atrás desta janela, então ele é refeito aqui.
document.addEventListener("contextmenu", async (event) => {
	event.preventDefault();
	const quit = await MenuItem.new({
		id: "quit",
		text: "Quit",
		action: () => {
			void exit(0);
		},
	});
	const menu = await Menu.new({ items: [quit] });
	await menu.popup();
});
