import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json";
import wasm from 'vite-plugin-wasm';

export default defineConfig({
  plugins: [react(), crx({ manifest }), wasm()],
  build: {
    sourcemap: true,
    rollupOptions: {
      input: {
        panel: "/src/panel.html",
      },
      output: {
        strict: false,
      },
    },
    target: 'esnext',
    minify: false,
  },
});
