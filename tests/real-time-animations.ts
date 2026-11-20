import { beforeAll } from "vitest";
import { commands } from "vitest/browser";

// For a file that reads an animation in flight.
beforeAll(() => commands.animationRate(1));
