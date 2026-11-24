import { beforeAll } from "vitest";
import { setAnimationRate } from "./harness/leaks";

// For a file that reads an animation in flight.
beforeAll(() => setAnimationRate(1));
