import { defineConfig } from "vite";

export default defineConfig({
  build: {
    emptyOutDir: false,
    outDir: "dist/main",
    lib: {
      entry: "src/main/index.ts",
      formats: ["es"],
      fileName: "index"
    },
    rollupOptions: {
      external: ["electron", "node:child_process", "node:crypto", "node:fs", "node:fs/promises", "node:path", "node:url"]
    }
  }
});
