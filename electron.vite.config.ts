import { sentryVitePlugin } from "@sentry/vite-plugin";
import path from "node:path";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";

// https://vitejs.dev/config/
export default defineConfig({
  main: {
    plugins: [
      externalizeDepsPlugin(),
      sentryVitePlugin({
        org: "casper-engelmann",
        project: "imapsync-app",
      }),
    ],
    build: {
      lib: {
        entry: path.resolve(__dirname, "electron/main.ts"),
        formats: ["es"],
      },
      outDir: "dist/main",
      sourcemap: true,
    },
  },

  preload: {
    build: {
      lib: {
        entry: path.resolve(__dirname, "electron/preload.ts"),
        formats: ["es"],
      },
      outDir: "dist/preload",
    },
  },

  renderer: {
    plugins: [
      react(),
      tailwindcss(),
      sentryVitePlugin({
        org: "casper-engelmann",
        project: "imapsync-app",
      }),
    ],
    resolve: {
      alias: {
        "~": path.resolve(__dirname, "src"),
      },
    },
    build: {
      outDir: "dist/renderer",
      sourcemap: true,
    },
  },
});