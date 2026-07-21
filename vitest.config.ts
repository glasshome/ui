import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [solid()],
	resolve: {
		conditions: ["browser", "development"],
	},
	test: {
		environment: "happy-dom",
		include: ["tests/**/*.test.{ts,tsx}"],
	},
});
