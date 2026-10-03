import { useEffect, useState } from "react";

const CLOCK_TICK_MS = 30_000;

/** The current time (ms since the epoch), refreshed every 30 s so link statuses change on their own. */
export function useNow() {
	const [now, setNow] = useState(() => Date.now());
	useEffect(() => {
		const id = setInterval(() => setNow(Date.now()), CLOCK_TICK_MS);
		return () => clearInterval(id);
	}, []);
	return now;
}
