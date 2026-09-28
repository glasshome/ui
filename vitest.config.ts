import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [solid()],
  resolve: {
    conditions: ["browser", "development"],
  },
  test: {
    environment: "happy-dom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    // Bound workers and per-worker heap: a leaking suite must fail with a heap
    // error, not exhaust system memory (unbounded forks each default to ~4GB).
    maxWorkers: 4,
    execArgv: ["--max-old-space-size=2048"],
  },
});
