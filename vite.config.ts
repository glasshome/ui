import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig({
  plugins: [solid()],
  build: {
    lib: {
      entry: {
        index: "src/index.ts",
        "solid/index": "src/solid/index.ts",
      },
      formats: ["es"],
    },
    rollupOptions: {
      external: ["solid-js", "solid-js/web", "solid-js/store"],
      output: {
        entryFileNames: "[name].js",
      },
    },
    target: "es2022",
  },
});
