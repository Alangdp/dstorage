import { defaultWindowIcon } from "@tauri-apps/api/app";
import { Image } from "@tauri-apps/api/image";

const SIZE = 32;
const ICON_SIZE = 22;
const BAR_X = 25;
const BAR_WIDTH = 6;
const BAR_TOP = 3;
const SEGMENT_HEIGHT = 5;
const SEGMENT_GAP = 2;

const FILLED = "#22c55e";
const EMPTY = "rgba(148, 163, 184, 0.45)";

const darkScheme = window.matchMedia("(prefers-color-scheme: dark)");

/**
 * The app icon is a black glyph on a transparent background, which vanishes on a dark
 * taskbar. Windows does not recolor tray icons, so the glyph is painted white or black
 * from the system theme (the closest signal the webview has to the taskbar color).
 */
function glyphColor(): [number, number, number] {
	return darkScheme.matches ? [255, 255, 255] : [0, 0, 0];
}

/**
 * Draws the tray icon: the app glyph tinted for the system theme, optionally with a
 * stack of `segments` progress blocks beside it, `filled` of them lit.
 * @param progress Blocks to draw, or `null` for the plain icon (nothing uploading).
 */
export async function drawTrayIcon(
	progress: { filled: number; segments: number } | null,
) {
	const base = await defaultWindowIcon();
	if (!base) {
		return null;
	}

	const [rgba, { width, height }] = await Promise.all([
		base.rgba(),
		base.size(),
	]);

	const pixels = new Uint8ClampedArray(rgba);
	const [r, g, b] = glyphColor();
	for (let i = 0; i < pixels.length; i += 4) {
		pixels[i] = r;
		pixels[i + 1] = g;
		pixels[i + 2] = b;
	}

	const source = document.createElement("canvas");
	source.width = width;
	source.height = height;
	const sourceCtx = source.getContext("2d");

	const canvas = document.createElement("canvas");
	canvas.width = SIZE;
	canvas.height = SIZE;
	const ctx = canvas.getContext("2d");
	if (!sourceCtx || !ctx) {
		return null;
	}

	sourceCtx.putImageData(new ImageData(pixels, width, height), 0, 0);
	ctx.imageSmoothingQuality = "high";

	if (progress === null) {
		ctx.drawImage(source, 0, 0, SIZE, SIZE);
	} else {
		ctx.drawImage(source, 0, (SIZE - ICON_SIZE) / 2, ICON_SIZE, ICON_SIZE);

		// Stack of blocks beside the icon, filling from the bottom up.
		for (let i = 0; i < progress.segments; i++) {
			const fromBottom = progress.segments - 1 - i;
			ctx.fillStyle = fromBottom < progress.filled ? FILLED : EMPTY;
			ctx.fillRect(
				BAR_X,
				BAR_TOP + i * (SEGMENT_HEIGHT + SEGMENT_GAP),
				BAR_WIDTH,
				SEGMENT_HEIGHT,
			);
		}
	}

	const out = ctx.getImageData(0, 0, SIZE, SIZE).data;
	return Image.new(new Uint8Array(out.buffer), SIZE, SIZE);
}

/** Calls `callback` whenever the system switches between light and dark. */
export function onSystemThemeChange(callback: () => void) {
	darkScheme.addEventListener("change", callback);
}
