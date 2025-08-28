import { defineConfig } from "vite";

export default defineConfig({
  build: {
    minify: false,
    cssMinify: false,
    sourcemap: true,
    outDir: "dist",
    emptyOutDir: true,
    lib: {
      entry: ["src/content-script.ts", "src/worker.ts"],
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
