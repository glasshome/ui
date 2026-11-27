import { configure } from "@solidjs/testing-library";
import { afterEach, beforeEach } from "vitest";
import "../src/styles/globals.css";
import { provideIcons } from "../src/solid/icon.js";
import { installDenyFetch, installSolidDiagnosticGuard } from "../src/testing/index.js";
import { expectNoLeaks, resetPage } from "./harness/leaks";

// No icon source in tests: every Icon renders its 1em placeholder synchronously
// and nothing reaches the network.
provideIcons({ bundled: {} });

installDenyFetch();
installSolidDiagnosticGuard();

// test-change-ok hang guard for findBy* and waitFor, matching the expect.poll guard in vitest.config.ts
configure({ asyncUtilTimeout: 4_000 });

beforeEach(resetPage);
afterEach(expectNoLeaks);

declare module "vitest/browser" {
  interface BrowserCommands {
    animationRate(rate?: number): Promise<void>;
    fitWindow(): Promise<void>;
  }
}
