import "./index.css";

import * as React from "react";
import ReactDOM from "react-dom/client";

import { App } from "~/renderer/app.js";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
