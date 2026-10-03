/**
 * Copies text to the clipboard.
 * @returns false when the browser denies access.
 */
export async function copyToClipboard(text: string) {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		return false;
	}
}
