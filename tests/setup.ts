import { provideIcons } from "../src/solid/icon.js";
import "./harness/animations";

// No icon source in tests: every Icon renders its 1em placeholder synchronously
// and nothing reaches the network.
provideIcons({ bundled: {} });
