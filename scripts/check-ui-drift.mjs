// Deny-by-default UI drift guard, shared by hub and dash. Glass, panels,
// pills, and callouts must come from @glasshome/ui (see SPEC.md); this scans
// app markup for the raw idioms those primitives replace.
//
// Escape hatch: `ui-drift-ok <reason>` in a comment on the line or the line
// above. SKIP_UI_DRIFT_CHECK=1 skips entirely.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const RULES = [
	[
		"hand-rolled blur",
		/(?:backdrop-blur(?:-\w+|-\[[^\]]+\])?|backdrop-filter)/,
		"blur belongs to the material: use <Card>/CARD_BLUR, OVERLAY_SURFACE, SCRIM_CLASS, or TRACK_SURFACE",
	],
	[
		"hand-rolled surface fill",
		/\b(?<!hover:)(?<!focus:)(?<!active:)(?<!group-hover:)bg-(?:card|background|popover)\/\d+/,
		"translucent surface fills come from <Card>, <Overlay>, or a --glass-base knob",
	],
	[
		"bespoke pill",
		/rounded-full[^"'`]*\bborder\b[^"'`]*bg-(?:card|background)\b/,
		"use <Badge tone> or <Button size=\"none\">",
	],
	[
		"raw palette color",
		/\b(?:bg|text|border)-(?:amber|green|yellow|red|blue|orange|emerald|rose|sky)-\d{3}\b/,
		"use theme vars: var(--success)/var(--warning)/var(--destructive) via <Badge>/<Alert>",
	],
	[
		"tinted callout",
		/border-(?:primary|destructive|warning|success)\/\d+[^"'`]*bg-(?:primary|destructive|warning|success)\/\d+/,
		"use <Alert tone> (Solid or astro) or ALERT_TONES",
	],
	[
		"shadcn field chrome",
		/border-input\s[^"'`]*bg-(?:background|transparent)\b/,
		"use INPUT_CLASS / INPUT_SURFACE / FIELD_CHROME from @glasshome/ui",
	],
	[
		"solid badge",
		/border-transparent\s+bg-primary\s+text-primary-foreground/,
		"use <Badge tone> — there are no solid badge variants",
	],
];

function walk(dir) {
	const out = [];
	for (const name of readdirSync(dir)) {
		const p = join(dir, name);
		const s = statSync(p);
		if (s.isDirectory()) out.push(...walk(p));
		else if (/\.(astro|tsx)$/.test(p)) out.push(p);
	}
	return out;
}

export function checkUiDrift({ root = "src", allowFiles = [], allowPrefixes = [] } = {}) {
	if (process.env.SKIP_UI_DRIFT_CHECK === "1") return 0;

	const offenders = [];
	for (const file of walk(root)) {
		if (allowFiles.includes(file)) continue;
		if (allowPrefixes.some((p) => file.startsWith(p))) continue;
		const text = readFileSync(file, "utf8");
		const lines = text.split("\n");
		const flagged = new Set();
		lines.forEach((line, i) => {
			if (line.includes("ui-drift-ok") || (i > 0 && lines[i - 1].includes("ui-drift-ok"))) return;
			for (const [type, re, fix] of RULES) {
				if (re.test(line)) {
					offenders.push({ file, line: i + 1, type, fix });
					flagged.add(type);
				}
			}
		});
		// Class lists split across lines evade line rules: rerun on a
		// whitespace-collapsed copy and report file-level hits not already seen.
		if (!text.includes("ui-drift-ok")) {
			const collapsed = text.replace(/\s+/g, " ");
			for (const [type, re, fix] of RULES) {
				if (!flagged.has(type) && re.test(collapsed)) {
					offenders.push({ file, line: 0, type: `${type} (multi-line)`, fix });
				}
			}
		}
	}

	if (offenders.length === 0) {
		console.log("ui:check — no hand-rolled primitives found ✓");
		return 0;
	}

	const byType = {};
	for (const o of offenders) (byType[o.type] ??= []).push(o);
	console.error(`ui:check — ${offenders.length} hand-rolled primitive(s) duplicating @glasshome/ui:\n`);
	for (const [type, list] of Object.entries(byType)) {
		console.error(`  ${type} (${list.length}) — ${list[0].fix}`);
		for (const o of list) console.error(`    ${o.file}${o.line ? `:${o.line}` : ""}`);
		console.error("");
	}
	console.error(
		"Migrate to the package primitive, or add `ui-drift-ok <reason>` in a line comment if bespoke is intended.",
	);
	return 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
	process.exit(checkUiDrift());
}
