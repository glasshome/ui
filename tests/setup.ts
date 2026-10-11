import { provideIcons } from "../src/solid/icon.js";
import { installSettledAnimations } from "../src/testing/index.js";

// No icon source in tests: every Icon renders its 1em placeholder synchronously
// and nothing reaches the network.
provideIcons({ bundled: {} });

installSettledAnimations();
