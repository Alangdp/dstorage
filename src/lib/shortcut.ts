// Pure helpers for global-shortcut accelerators ("CommandOrControl+Shift+U"), the string
// format `tauri-plugin-global-shortcut` registers. No Tauri calls here.

const MODIFIERS = ["CommandOrControl", "Alt", "Shift"] as const;

// Keys whose `KeyboardEvent.code` is not the name the plugin expects.
const NAMED_KEYS: Record<string, string> = {
	Space: "Space",
	ArrowUp: "Up",
	ArrowDown: "Down",
	ArrowLeft: "Left",
	ArrowRight: "Right",
	Enter: "Enter",
	Backquote: "`",
	Minus: "-",
	Equal: "=",
	BracketLeft: "[",
	BracketRight: "]",
	Backslash: "\\",
	Semicolon: ";",
	Quote: "'",
	Comma: ",",
	Period: ".",
	Slash: "/",
};

/** Maps a physical key (`KeyboardEvent.code`) to the plugin's key name, or null if unsupported. */
function keyName(code: string): string | null {
	if (/^Key[A-Z]$/.test(code)) {
		return code.slice(3);
	}
	if (/^Digit[0-9]$/.test(code)) {
		return code.slice(5);
	}
	if (/^F([1-9]|1[0-9]|2[0-4])$/.test(code)) {
		return code;
	}
	return NAMED_KEYS[code] ?? null;
}

/**
 * Builds an accelerator from a key press, or null when the press is not a usable shortcut
 * (only a modifier so far, an unsupported key, or no modifier on a regular key: a global
 * shortcut on a bare letter would block typing in every program).
 */
export function eventToAccelerator(event: {
	code: string;
	ctrlKey: boolean;
	metaKey: boolean;
	altKey: boolean;
	shiftKey: boolean;
}): string | null {
	const key = keyName(event.code);
	if (!key) {
		return null;
	}

	const parts: string[] = [];
	if (event.ctrlKey || event.metaKey) {
		parts.push("CommandOrControl");
	}
	if (event.altKey) {
		parts.push("Alt");
	}
	if (event.shiftKey) {
		parts.push("Shift");
	}

	// Function keys are the one case that is fine on their own.
	if (parts.length === 0 && !/^F\d+$/.test(key)) {
		return null;
	}
	return [...parts, key].join("+");
}

/** Whether `value` is a well-formed accelerator, as saved by {@link eventToAccelerator}. */
export function isAccelerator(value: unknown): value is string {
	if (typeof value !== "string" || value.length === 0) {
		return false;
	}
	const parts = value.split("+");
	const key = parts.pop();
	return (
		!!key &&
		parts.every((part) => (MODIFIERS as readonly string[]).includes(part)) &&
		(parts.length > 0 || /^F\d+$/.test(key))
	);
}

/** Human-readable form of an accelerator for the settings screen ("Ctrl+Shift+U"). */
export function formatAccelerator(accelerator: string) {
	const isMac = navigator.userAgent.includes("Mac");
	return accelerator
		.split("+")
		.map((part) =>
			part === "CommandOrControl" ? (isMac ? "Cmd" : "Ctrl") : part,
		)
		.join("+");
}
