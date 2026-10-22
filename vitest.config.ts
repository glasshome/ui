import tailwindcss from "@tailwindcss/vite";
import { playwright } from "@vitest/browser-playwright";
import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";

// Forked workers inherit it, so a direct run matches the gate; bun test is UTC already.
process.env.TZ = "UTC";

const READS_FILES_NO_DOM = [
  "tests/tokens/**",
  "tests/styles/**",
  "tests/gallery-coverage.test.ts",
  "tests/lib/{material,glass-tone,utils}.test.ts",
  "tests/bottom-sheet/{state-machine,velocity}.test.ts",
  "tests/solid/{dock-paging,spotlight-geometry}.test.ts",
];
// The shim dash, hub, widget-sdk, widget-realm and governor still install runs where they run it.
const HAPPY_DOM_SHIM = ["tests/happy-dom-fidelity.test.ts"];

export default defineConfig({
  plugins: [solid({ dev: false, hot: false }), tailwindcss()],
  resolve: {
    conditions: ["browser"],
  },
  optimizeDeps: {
    include: [
      "solid-js",
      "solid-js/web",
      "solid-js/store",
      "@solidjs/testing-library",
      "clsx",
      "cva",
      "tailwind-merge",
      "embla-carousel",
      "embla-carousel-autoplay",
      "embla-carousel-fade",
      "@iconify/utils",
    ],
  },
  test: {
    // Unset, vite-plugin-solid asks for jsdom, which a clean install does not have.
    environment: "node",
    maxWorkers: 4,
    projects: [
      {
        extends: true,
        test: { name: "node", environment: "node", include: READS_FILES_NO_DOM },
      },
      {
        extends: true,
        test: { name: "happy-dom", environment: "happy-dom", include: HAPPY_DOM_SHIM },
      },
      {
        extends: true,
        test: {
          name: "chromium",
          setupFiles: ["./tests/setup.ts"],
          include: ["tests/**/*.test.{ts,tsx}"],
          exclude: [...READS_FILES_NO_DOM, ...HAPPY_DOM_SHIM],
          browser: {
            enabled: true,
            headless: true,
            screenshotFailures: false,
            viewport: { width: 1024, height: 768 },
            provider: playwright({
              // test-change-ok a press that cannot land fails in 5 s instead of waiting out the test
              actionTimeout: 5000,
              contextOptions: { permissions: ["clipboard-read", "clipboard-write"] },
            }),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
