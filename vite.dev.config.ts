import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

/* Dev-only gallery server (`bun run dev:gallery`). The publishable library
 * build stays in vite.config.ts; this config never ships anything. */
export default defineConfig({
	root: "dev",
	plugins: [solid(), tailwindcss()],
	resolve: {
		conditions: ["@glasshome/source"],
	},
	server: {
		port: 5199,
	},
});
