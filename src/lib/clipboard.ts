/** Copia o texto para a área de transferência. Devolve false se o navegador negar. */
export async function copyToClipboard(text: string) {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		return false;
	}
}
