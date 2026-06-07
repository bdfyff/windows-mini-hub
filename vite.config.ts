import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
  root: "src/renderer",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src/renderer/src")
    }
  },
  build: {
    outDir: "../../dist/renderer",
    emptyOutDir: true
  }
});
