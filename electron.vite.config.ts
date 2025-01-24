import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: resolve(__dirname, "electron/main.ts"),
        formats: ["es"],
      },
      outDir: "dist/main",
    },
  },
  preload: {
    build: {
      lib: {
        entry: resolve(__dirname, "electron/preload.ts"),
        formats: ["es"],
      },
      outDir: "dist/preload",
    },
  },
  renderer: {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "~": resolve(__dirname, "src"),
      },
    },
    build: {
      outDir: "dist/renderer",
    },
  },
});
