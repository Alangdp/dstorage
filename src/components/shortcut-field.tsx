import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n";
import { eventToAccelerator, formatAccelerator } from "@/lib/shortcut";

type ShortcutFieldProps = {
	/** Id for the input, so a `Label` can point at it. */
	id: string;
	/** The accelerator shown, or null when the shortcut is off. */
	value: string | null;
	/** Called with the new accelerator, or null when the user turns it off. */
	onChange: (value: string | null) => void;
};

/** Field that records a key combination while focused, with a button to turn it off. */
export function ShortcutField({ id, value, onChange }: ShortcutFieldProps) {
	const { t } = useI18n();
	const [recording, setRecording] = useState(false);

	function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
		// Tab and Esc keep their normal job (moving focus, hiding the window).
		if (event.key === "Tab" || event.key === "Escape") {
			return;
		}
		event.preventDefault();
		// Stops the window-level Esc/shortcut handlers from seeing a key meant for the field.
		event.stopPropagation();

		const accelerator = eventToAccelerator(event);
		if (accelerator) {
			onChange(accelerator);
		}
	}

	// The chosen combination stays visible while recording, so the user sees what they pressed.
	let display = t("settings.shortcutOff");
	if (value) {
		display = formatAccelerator(value);
	} else if (recording) {
		display = t("settings.shortcutPress");
	}

	return (
		<div className="flex gap-2">
			<Input
				id={id}
				readOnly
				value={display}
				onKeyDown={handleKeyDown}
				onFocus={() => setRecording(true)}
				onBlur={() => setRecording(false)}
			/>
			<Button
				type="button"
				variant="outline"
				disabled={!value}
				onClick={() => onChange(null)}
			>
				{t("settings.shortcutClear")}
			</Button>
		</div>
	);
}
