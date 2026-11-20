import { commands } from "vitest/browser";
import "../src/styles/globals.css";
import { provideIcons } from "../src/solid/icon.js";
import { installDenyFetch } from "../src/testing/index.js";

// No icon source in tests: every Icon renders its 1em placeholder synchronously
// and nothing reaches the network.
provideIcons({ bundled: {} });

installDenyFetch();

await commands.animationRate();
// The file before leaves the pointer anywhere; a control mounted under it starts hovered.
await commands.mouse("move", innerWidth - 1, innerHeight - 1);

declare module "vitest/browser" {
  interface BrowserCommands {
    animationRate(rate?: number): Promise<void>;
  }
}
