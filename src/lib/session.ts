// The signed-in session, kept in the app's localStorage so it survives restarts. This
// module only stores and validates it; talking to the backend lives in `auth.ts` and
// `http.ts`, which depend on this one (not the other way around).

const STORAGE_KEY = "dstorage.session.v1";

/** The account the session belongs to. */
export type SessionUser = {
	id: string;
	email: string;
};

/** Tokens and account of the signed-in user. */
export type Session = {
	accessToken: string;
	/** Always the latest one: the backend revokes it as soon as it is used. */
	refreshToken: string;
	user: SessionUser;
};

type Listener = () => void;

const listeners = new Set<Listener>();

function isSession(value: unknown): value is Session {
	if (typeof value !== "object" || value === null) {
		return false;
	}
	const { accessToken, refreshToken, user } = value as Partial<Session>;
	return (
		typeof accessToken === "string" &&
		typeof refreshToken === "string" &&
		typeof user?.id === "string" &&
		typeof user?.email === "string"
	);
}

function readStored(): Session | null {
	try {
		const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "");
		return isSession(parsed) ? parsed : null;
	} catch {
		return null;
	}
}

// Cached so `useSyncExternalStore` gets a stable reference between changes.
let current: Session | null = readStored();

/** The current session, or `null` when nobody is signed in. */
export function getSession() {
	return current;
}

/** Replaces the session (or signs out with `null`) and notifies subscribers. */
export function setSession(session: Session | null) {
	current = session;
	try {
		if (session) {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
		} else {
			localStorage.removeItem(STORAGE_KEY);
		}
	} catch {
		// Without localStorage the session only lasts until the app closes.
	}
	for (const listener of listeners) {
		listener();
	}
}

/** Calls `listener` whenever the session changes. Returns the unsubscribe function. */
export function subscribeSession(listener: Listener) {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}
