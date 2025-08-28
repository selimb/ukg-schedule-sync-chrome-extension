import preact from "@preact/preset-vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [preact()],
  build: {
    minify: false,
    cssMinify: false,
    sourcemap: true,
    outDir: "dist",
    emptyOutDir: true,
    lib: {
      entry: [
        "src/content-script.ts",
        "src/worker.ts",
        "src/options/index.tsx",
      ],
      formats: ["es"],
    },
    rollupOptions: {
      output: {
        preserveModulesRoot: "src",
        preserveModules: true,
      },
    },
  },
  esbuild: {
    target: "es2022",
  },
});
