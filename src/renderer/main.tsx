import "./index.css";

import * as React from "react";
import ReactDOM from "react-dom/client";
import * as Sentry from "@sentry/electron/renderer";

import { App } from "~/renderer/app.js";

// Initialize Sentry in renderer process
Sentry.init({
  dsn: "https://2ef398fb3103913aa8b919833e378ef6@o4508755915571200.ingest.de.sentry.io/4508755917013072",
  integrations: [Sentry.captureConsoleIntegration()],
});

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
