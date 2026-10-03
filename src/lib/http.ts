import axios from "axios";

/** Cliente do backend (o que fala com o S3 e guarda as configurações). */
export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

/** Mensagem do backend ({ "error": "..." }) quando existir, senão o erro original. */
export function toError(error: unknown) {
	if (axios.isAxiosError(error) && error.response?.data?.error) {
		return new Error(String(error.response.data.error));
	}
	return error instanceof Error ? error : new Error(String(error));
}

export async function post<T>(path: string, body: unknown): Promise<T> {
	try {
		const { data } = await api.post<T>(path, body);
		return data;
	} catch (error) {
		throw toError(error);
	}
}
