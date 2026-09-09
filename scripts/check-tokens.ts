// Fails when styles/theme.css and tokens/presets.ts (midnight-glass) drift.
import { readFileSync } from "node:fs";
import path from "node:path";
import { DEFAULT_THEME_ID, getPreset, parseThemeBlock, type ThemeColors } from "../src/tokens";

const css = readFileSync(
	path.resolve(path.dirname(new URL(import.meta.url).pathname), "../src/styles/theme.css"),
	"utf8",
);

const KEYS: Record<string, keyof ThemeColors> = {
	"--primary": "primary",
	"--accent": "accent",
	"--secondary": "secondary",
	"--border": "border",
	"--card": "card",
	"--background": "background",
	"--muted": "muted",
	"--muted-foreground": "mutedForeground",
	"--input": "input",
	"--ring": "ring",
	"--destructive": "destructive",
	"--popover": "popover",
};

const preset = getPreset(DEFAULT_THEME_ID);
if (!preset) throw new Error(`preset missing: ${DEFAULT_THEME_ID}`);

let drift = 0;
for (const [mode, block] of [
	["light", ":root"],
	["dark", ".dark"],
] as const) {
	const vars = parseThemeBlock(css, block);
	for (const [cssKey, tokenKey] of Object.entries(KEYS)) {
		const cssValue = vars[cssKey];
		const tokenValue = preset.colors[mode][tokenKey];
		if (cssValue !== tokenValue) {
			console.error(`${mode} ${cssKey}: css="${cssValue}" tokens="${tokenValue}"`);
			drift++;
		}
	}
}

if (drift > 0) {
	console.error(`${drift} token(s) drifted between theme.css and tokens/presets.ts`);
	process.exit(1);
}
console.log("theme.css and tokens/presets.ts in sync");
