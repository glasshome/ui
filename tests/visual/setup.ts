import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "../setup";
import lucide from "@iconify-json/lucide/icons.json";
import { getIconData } from "@iconify/utils";
import type { IconifyIcon } from "@iconify/types";
import { provideIcons } from "../../src/solid/icon.js";
import { setAnimationRate } from "../harness/leaks";

// A shot shows the icons a home shows, so every lucide icon is bundled here.
const bundled: Record<string, IconifyIcon> = {};
for (const name of Object.keys(lucide.icons)) {
  const data = getIconData(lucide, name);
  if (data) bundled[`lucide:${name}`] = data;
}
provideIcons({ bundled });

// Baselines are recorded at the real rate.
await setAnimationRate(1);
