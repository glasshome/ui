import { commands } from "vitest/browser";
import "../src/styles/globals.css";
import { provideIcons } from "../src/solid/icon.js";
import { installDenyFetch } from "../src/testing/index.js";

// No icon source in tests: every Icon renders its 1em placeholder synchronously
// and nothing reaches the network.
provideIcons({ bundled: {} });

installDenyFetch();

await commands.animationRate();

declare module "vitest/browser" {
  interface BrowserCommands {
    animationRate(rate?: number): Promise<void>;
  }
}
