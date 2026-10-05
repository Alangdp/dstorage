import { useSyncExternalStore } from "react";
import { getSession, subscribeSession } from "@/lib/session";

/** The signed-in session (`null` when signed out); re-renders when it changes. */
export function useSession() {
	return useSyncExternalStore(subscribeSession, getSession);
}
