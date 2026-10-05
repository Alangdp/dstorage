import axios from "axios";
import { t } from "@/i18n";
import { api, requestTokens, toError } from "@/lib/http";
import { getSession, setSession } from "@/lib/session";

type TokenPair = { access_token: string; refresh_token: string };

type User = { id: string; email: string };

/**
 * Signs in and stores the session.
 * @throws An `Error` with a translated message when the credentials are wrong, or the
 * backend's message for any other failure.
 */
export async function login(email: string, password: string) {
	let tokens: TokenPair;
	try {
		({ data: tokens } = await api.post<TokenPair>("/login", {
			email,
			password,
		}));
	} catch (error) {
		if (axios.isAxiosError(error) && error.response?.status === 401) {
			throw new Error(t("login.errorCredentials"));
		}
		throw toError(error);
	}

	// The login response has no account data, and the session is not stored yet, so the
	// new token is sent by hand.
	let user: User;
	try {
		({ data: user } = await api.get<User>("/me", {
			headers: { Authorization: `Bearer ${tokens.access_token}` },
		}));
	} catch (error) {
		throw toError(error);
	}

	setSession({
		accessToken: tokens.access_token,
		refreshToken: tokens.refresh_token,
		user: { id: user.id, email: user.email },
	});
}

// The session is cleared before these calls, so the interceptor adds no token; the
// access token is sent by hand.
function revokeRefreshToken(accessToken: string, refreshToken: string) {
	return api.post(
		"/logout",
		{ refresh_token: refreshToken },
		{ headers: { Authorization: `Bearer ${accessToken}` } },
	);
}

/** Signs out on this computer and revokes the refresh token on the backend (best effort). */
export async function logout() {
	const session = getSession();
	setSession(null);
	if (!session) {
		return;
	}
	try {
		await revokeRefreshToken(session.accessToken, session.refreshToken);
	} catch (error) {
		// The backend rejects /logout with an expired access token before it can revoke
		// anything. Renew the pair (which revokes the old refresh token) and revoke the
		// new one, so no refresh token is left alive.
		if (axios.isAxiosError(error) && error.response?.status === 401) {
			try {
				const tokens = await requestTokens(session.refreshToken);
				await revokeRefreshToken(tokens.access_token, tokens.refresh_token);
			} catch {
				// Already expired or revoked, or the network is down.
			}
		}
		// Any other failure: the local session is already gone, and the refresh token
		// is left to expire on its own.
	}
}
