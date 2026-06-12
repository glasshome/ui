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
			external: [
				"solid-js",
				"solid-js/web",
				"solid-js/store",
				// Host-provided singleton via import map: bundling a copy here splits
				// the <iconify-icon> element from the host's icon registrations.
				// (Core only; the @iconify-icon/solid wrapper is stateless.)
				"iconify-icon",
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
