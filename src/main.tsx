import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { initTheme } from "./lib/theme";
import { setupTray } from "./tray/setup";
import { setupCloseToTray, setupTrayDropEvents } from "./tray/window";

initTheme();
setupTray().catch(console.error);
setupTrayDropEvents().catch(console.error);
setupCloseToTray().catch(console.error);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
);
