import { listen } from "@tauri-apps/api/event";
import {
	getCurrentWindow,
	monitorFromPoint,
	PhysicalPosition,
	type PhysicalSize,
} from "@tauri-apps/api/window";

import { TRAY_DRAG_ENTER, TRAY_TOGGLE } from "./events";

export type TrayRect = { position: PhysicalPosition; size: PhysicalSize };

const TRAY_WINDOW_GAP = 8;

// Encosta a janela no ícone do tray: acima se a barra de tarefas está embaixo,
// abaixo se está em cima. Tudo em pixels físicos, limitado à área de trabalho.
async function positionNearTray(rect: TrayRect) {
	const win = getCurrentWindow();
	const iconCenterX = rect.position.x + rect.size.width / 2;
	const iconCenterY = rect.position.y + rect.size.height / 2;

	const monitor = await monitorFromPoint(iconCenterX, iconCenterY);
	if (!monitor) return;

	const { position: wa, size: ws } = monitor.workArea;
	const { width, height } = await win.outerSize();

	const taskbarAtBottom = iconCenterY > wa.y + ws.height / 2;

	const x = Math.min(
		Math.max(iconCenterX - width / 2, wa.x),
		wa.x + ws.width - width,
	);
	const y = taskbarAtBottom
		? rect.position.y - height - TRAY_WINDOW_GAP
		: rect.position.y + rect.size.height + TRAY_WINDOW_GAP;

	await win.setPosition(
		new PhysicalPosition(
			Math.round(x),
			Math.round(Math.min(Math.max(y, wa.y), wa.y + ws.height - height)),
		),
	);
}

// Clique no tray tira o foco da janela, então `isFocused` não serve para decidir:
// visível e não minimizada => esconde; senão => mostra e foca.
export async function toggleMainWindow(rect: TrayRect) {
	const win = getCurrentWindow();
	const [visible, minimized] = await Promise.all([
		win.isVisible(),
		win.isMinimized(),
	]);

	if (visible && !minimized) {
		await win.hide();
		return;
	}

	await showMainWindow(rect);
}

/** Abre a janela onde ela estiver, sem posicionar (não há retângulo do tray, como no Linux). */
export async function openMainWindow() {
	const win = getCurrentWindow();
	await win.show();
	await win.unminimize();
	await win.setFocus();
}

async function showMainWindow(rect: TrayRect) {
	const win = getCurrentWindow();
	await positionNearTray(rect);
	await win.show();
	await win.unminimize();
	await win.setFocus();
}

// A janela transparente sobre o ícone avisa dos cliques e de arquivos arrastados até ele.
export async function setupTrayDropEvents() {
	await listen<TrayRect>(TRAY_TOGGLE, (event) => {
		void toggleMainWindow(event.payload).catch(console.error);
	});

	await listen<TrayRect>(TRAY_DRAG_ENTER, async (event) => {
		const win = getCurrentWindow();
		if (await win.isVisible()) return;
		// Sem setFocus: o foco roubado cancelaria o arrasto em andamento.
		await positionNearTray(event.payload);
		await win.show();
	});
}

// Botão de fechar esconde a janela no tray; o app só encerra pelo "Quit".
export async function setupCloseToTray() {
	await getCurrentWindow().onCloseRequested(async (event) => {
		event.preventDefault();
		await getCurrentWindow().hide();
	});
}
