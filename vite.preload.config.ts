import { defineConfig } from "vite";

export default defineConfig({
  build: {
    emptyOutDir: false,
    outDir: "dist/preload",
    lib: {
      entry: "src/preload/index.ts",
      formats: ["cjs"],
      fileName: "index"
    },
    rollupOptions: {
      external: ["electron"]
    }
  }
});
