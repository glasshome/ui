import tailwindcss from "@tailwindcss/vite";
import { playwright } from "@vitest/browser-playwright";
import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";
import {
  animationRate,
  frameAxTree,
  compose,
  emulateMedia,
  mouse,
  pointer,
  touch,
  wheel,
} from "./tests/commands";

// Forked workers inherit it, so a direct run matches the gate; bun test is UTC already.
process.env.TZ = "UTC";

const READS_FILES_NO_DOM = [
  "tests/tokens/**",
  "tests/styles/**",
  "tests/gallery-coverage.test.ts",
  "tests/harness/contracts-covered.test.ts",
  "tests/behavior/server-import.test.ts",
  "tests/drive/{trace,budget}.test.ts",
  "tests/lib/{material,glass-tone,utils,anchor-placement,color}.test.ts",
  "tests/bottom-sheet/{state-machine,velocity}.test.ts",
  "tests/solid/{dock-paging,spotlight-geometry}.test.ts",
];
// The shim dash, hub, widget-sdk, widget-realm and governor still install runs where they run it.
const HAPPY_DOM_SHIM = ["tests/happy-dom-fidelity.test.ts"];
// Baselines hold only in the Playwright image's fonts and rasteriser: `bun run test:visual:image`.
const VISUAL = "tests/visual/**/*.test.tsx";
const DRIVE = "tests/drive/*.e2e.test.ts";

const BROWSER = {
  enabled: true,
  headless: true,
  screenshotFailures: false,
  viewport: { width: 1024, height: 768 },
  provider: playwright({
    // test-change-ok a press that cannot land fails in 5 s instead of waiting out the test
    actionTimeout: 5000,
    contextOptions: { permissions: ["clipboard-read", "clipboard-write"] },
  }),
  instances: [{ browser: "chromium" as const }],
  commands: {
    animationRate,
    axTree: frameAxTree,
    compose,
    emulateMedia,
    mouse,
    pointer,
    touch,
    wheel,
  },
};

// Engines that differ on one CSS behaviour; Chromium runs these files too.
const WEBKIT_FILES = [
  "tests/contracts/scroll-contain.contract.test.tsx",
  "tests/contracts/anchored.contract.test.tsx",
  "tests/contracts/modal-root-dormant.contract.test.tsx",
];

export default defineConfig({
  plugins: [solid({ dev: false, hot: false }), tailwindcss()],
  resolve: {
    conditions: ["browser"],
  },
  optimizeDeps: {
    // A dependency found mid-run re-optimizes and reloads the page, failing the in-flight test import.
    noDiscovery: true,
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
      "axe-core",
      "@guidepup/virtual-screen-reader",
      "dom-accessibility-api",
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
          name: "drive",
          environment: "node",
          include: [DRIVE],
          // test-change-ok each case spawns the driver, which launches Chromium
          testTimeout: 60_000,
          // test-change-ok the hook builds the gallery
          hookTimeout: 240_000,
        },
      },
      {
        extends: true,
        test: {
          name: "chromium",
          setupFiles: ["./tests/setup.ts"],
          include: ["tests/**/*.test.{ts,tsx}"],
          exclude: [...READS_FILES_NO_DOM, ...HAPPY_DOM_SHIM, VISUAL, DRIVE],
          browser: BROWSER,
        },
      },
      {
        extends: true,
        test: {
          name: "webkit",
          setupFiles: ["./tests/setup.ts"],
          include: WEBKIT_FILES,
          browser: {
            ...BROWSER,
            instances: [{ browser: "webkit" as const }],
            // WebKit has no clipboard permission to grant.
            // test-change-ok same 5 s as the shared provider, restated since this one replaces it
            provider: playwright({ actionTimeout: 5000 }),
          },
        },
      },
      {
        extends: true,
        test: {
          name: "visual",
          setupFiles: ["./tests/visual/setup.ts"],
          include: [VISUAL],
          browser: {
            ...BROWSER,
            // A page smaller than the frame scales every shot down; this fits the widest one.
            provider: playwright({
              // test-change-ok same 5 s as the shared provider, restated since this one replaces it
              actionTimeout: 5000,
              contextOptions: { viewport: { width: 1280, height: 900 } },
            }),
          },
        },
      },
    ],
  },
});
