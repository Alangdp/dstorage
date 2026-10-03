import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { setLanguage } from "./i18n";
import "./index.css";
import { loadSettings } from "./lib/settings";
import { initTheme } from "./lib/theme";
import { setupTray } from "./tray/setup";
import { setupCloseToTray, setupTrayDropEvents } from "./tray/window";

// The language must be set before anything that builds translated text (tray menu, history).
setLanguage(loadSettings().language);
initTheme();
setupTray().catch(console.error);
setupTrayDropEvents().catch(console.error);
setupCloseToTray().catch(console.error);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
);
