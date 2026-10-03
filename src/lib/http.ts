import axios from "axios";

/** Client for the backend (the one that talks to S3 and holds the server settings). */
export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

/** The backend's message (`{ "error": "..." }`) when there is one, otherwise the original error. */
export function toError(error: unknown) {
	if (axios.isAxiosError(error) && error.response?.data?.error) {
		return new Error(String(error.response.data.error));
	}
	return error instanceof Error ? error : new Error(String(error));
}

/**
 * POSTs JSON to the backend.
 * @throws An `Error` carrying the backend's message when it sent one.
 */
export async function post<T>(path: string, body: unknown): Promise<T> {
	try {
		const { data } = await api.post<T>(path, body);
		return data;
	} catch (error) {
		throw toError(error);
	}
}
