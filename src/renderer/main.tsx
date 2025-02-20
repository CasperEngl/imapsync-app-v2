import "./index.css";

import * as Sentry from "@sentry/electron/renderer";
import * as React from "react";
import ReactDOM from "react-dom/client";

import { AppRoot } from "~/renderer/app-root.js";
import { Providers } from "~/renderer/providers.js";

// Initialize Sentry in renderer process
Sentry.init({
  dsn: "https://2ef398fb3103913aa8b919833e378ef6@o4508755915571200.ingest.de.sentry.io/4508755917013072",
  integrations: [
    Sentry.captureConsoleIntegration(),
    Sentry.scopeToMainIntegration(),
  ],
  enabled: import.meta.env.PROD,
  ignoreErrors: [
    // Ignore Vite-specific messages
    /\[vite\]/,
    /\[hmr\]/,
    /\[webpack-dev-server\]/,
  ],
});

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <Providers>
      <AppRoot />
    </Providers>
  </React.StrictMode>,
);
