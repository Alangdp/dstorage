import axios, { type InternalAxiosRequestConfig } from "axios";
import { getSession, setSession } from "@/lib/session";

const baseURL = import.meta.env.VITE_API_URL;

/** Client for the backend (the one that talks to S3 and holds the server settings). */
export const api = axios.create({ baseURL });

/** Routes that never carry (or need to renew) an access token. */
const PUBLIC_PATHS = ["/login", "/refresh"];

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

type TokenPair = { access_token: string; refresh_token: string };

/** The backend's message (`{ "error": ... }` or `{ "message": ... }`) when there is one, otherwise the original error. */
export function toError(error: unknown) {
	if (axios.isAxiosError(error)) {
		const data = error.response?.data;
		const message = data?.error ?? data?.message;
		if (message) {
			return new Error(String(message));
		}
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

/**
 * Trades a refresh token for a new token pair, without touching the stored session.
 * The backend revokes the token it receives, so the caller must keep the returned pair.
 */
export async function requestTokens(refreshToken: string) {
	// A bare axios call, so the interceptors below never recurse into it.
	const { data } = await axios.post<TokenPair>(
		"/refresh",
		{ refresh_token: refreshToken },
		{ baseURL },
	);
	return data;
}

// One refresh at a time: the backend revokes a refresh token on use, so two parallel
// refreshes with the same token would make the second one sign the user out.
let refreshing: Promise<string> | null = null;

/** Trades the refresh token for a new pair and returns the new access token. */
function refreshAccessToken() {
	refreshing ??= (async () => {
		const session = getSession();
		if (!session) {
			throw new Error("No session to refresh");
		}
		try {
			const data = await requestTokens(session.refreshToken);
			setSession({
				...session,
				accessToken: data.access_token,
				refreshToken: data.refresh_token,
			});
			return data.access_token;
		} catch (error) {
			// Only a rejection means the session is over; a network failure keeps it.
			if (axios.isAxiosError(error) && error.response?.status === 401) {
				setSession(null);
			}
			throw error;
		}
	})().finally(() => {
		refreshing = null;
	});
	return refreshing;
}

api.interceptors.request.use((config) => {
	const session = getSession();
	if (session && !PUBLIC_PATHS.includes(config.url ?? "")) {
		config.headers.set("Authorization", `Bearer ${session.accessToken}`);
	}
	return config;
});

api.interceptors.response.use(undefined, async (error: unknown) => {
	if (!axios.isAxiosError(error) || error.response?.status !== 401) {
		throw error;
	}
	const config = error.config as RetriableConfig | undefined;
	if (
		!config ||
		config._retried ||
		PUBLIC_PATHS.includes(config.url ?? "") ||
		!getSession()
	) {
		throw error;
	}

	config._retried = true;
	try {
		config.headers.set("Authorization", `Bearer ${await refreshAccessToken()}`);
	} catch {
		// Surface the original 401 so callers see why the request failed.
		throw error;
	}
	return api(config);
});
