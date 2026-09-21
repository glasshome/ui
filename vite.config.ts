import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig({
	plugins: [solid()],
	build: {
		// tsc emits the .d.ts files into dist as a separate step, and a watch
		// rebuild must not delete them. `build` cleans dist itself instead.
		emptyOutDir: false,
		lib: {
			entry: {
				index: "src/index.ts",
				"solid/index": "src/solid/index.ts",
				"tokens/index": "src/tokens/index.ts",
				"backgrounds/index": "src/backgrounds/index.ts",
			},
			formats: ["es"],
		},
		rollupOptions: {
			external: [
				"solid-js",
				"solid-js/web",
				"solid-js/store",
				"@glasshome/sync-layer",
				"@glasshome/sync-layer/solid",
			],
			output: {
				entryFileNames: "[name].js",
			},
		},
		target: "es2022",
	},
});
