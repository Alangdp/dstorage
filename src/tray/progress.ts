import { defaultWindowIcon } from "@tauri-apps/api/app";
import { Image } from "@tauri-apps/api/image";
import { getTray } from "./setup";

export const TRAY_SEGMENTS = 4;

const SIZE = 32;
const ICON_SIZE = 22;
const BAR_X = 25;
const BAR_WIDTH = 6;
const BAR_TOP = 3;
const SEGMENT_HEIGHT = 5;
const SEGMENT_GAP = 2;

const FILLED = "#22c55e";
const EMPTY = "rgba(148, 163, 184, 0.45)";

async function drawIcon(filled: number) {
	const base = await defaultWindowIcon();
	if (!base) return null;

	const [rgba, { width, height }] = await Promise.all([
		base.rgba(),
		base.size(),
	]);

	const source = document.createElement("canvas");
	source.width = width;
	source.height = height;
	const sourceCtx = source.getContext("2d");

	const canvas = document.createElement("canvas");
	canvas.width = SIZE;
	canvas.height = SIZE;
	const ctx = canvas.getContext("2d");
	if (!sourceCtx || !ctx) return null;

	sourceCtx.putImageData(
		new ImageData(new Uint8ClampedArray(rgba), width, height),
		0,
		0,
	);
	ctx.drawImage(source, 0, (SIZE - ICON_SIZE) / 2, ICON_SIZE, ICON_SIZE);

	// Pilha de 4 blocos ao lado do ícone, enchendo de baixo para cima.
	for (let i = 0; i < TRAY_SEGMENTS; i++) {
		const fromBottom = TRAY_SEGMENTS - 1 - i;
		ctx.fillStyle = fromBottom < filled ? FILLED : EMPTY;
		ctx.fillRect(
			BAR_X,
			BAR_TOP + i * (SEGMENT_HEIGHT + SEGMENT_GAP),
			BAR_WIDTH,
			SEGMENT_HEIGHT,
		);
	}

	const pixels = ctx.getImageData(0, 0, SIZE, SIZE).data;
	return Image.new(new Uint8Array(pixels.buffer), SIZE, SIZE);
}

/**
 * Mostra no ícone da bandeja quantos dos 4 blocos já estão cheios.
 * `null` volta ao ícone padrão (nada sendo enviado).
 */
export async function setTrayProgress(filled: number | null) {
	const tray = getTray();
	if (!tray) return;

	if (filled === null) {
		const icon = await defaultWindowIcon();
		if (icon) await tray.setIcon(icon);
		await tray.setTooltip("dstorage");
		return;
	}

	const icon = await drawIcon(filled);
	if (icon) await tray.setIcon(icon);
	await tray.setTooltip(`dstorage — enviando (${filled}/${TRAY_SEGMENTS})`);
}
