import { oklchToHex } from "./hex.js";

/** Every custom property declared in one theme.css block (`:root`, `.dark`). */
export function parseThemeBlock(css: string, block: string): Record<string, string> {
	const match = css.match(
		new RegExp(`${block.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\{([^}]*)\\}`),
	);
	if (!match) throw new Error(`block not found in theme.css: ${block}`);
	const vars: Record<string, string> = {};
	for (const line of (match[1] ?? "").split("\n")) {
		const m = line.match(/^\s*(--[\w-]+):\s*(.+?);\s*$/);
		const [, name, value] = m ?? [];
		if (name && value) vars[name] = value;
	}
	return vars;
}

function luminance(oklch: string): number {
	const hex = oklchToHex(oklch);
	const [r, g, b] = [1, 3, 5]
		.map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255)
		.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)) as [
		number,
		number,
		number,
	];
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast between two oklch() literals. */
export function contrastRatio(a: string, b: string): number {
	const [x, y] = [luminance(a), luminance(b)];
	return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
