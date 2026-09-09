import { readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { extname, join } from "node:path";
import type { IconifyIcon, IconifyJSON } from "@iconify/types";
import { getIconData } from "@iconify/utils";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type Plugin } from "vite";
import solid from "vite-plugin-solid";

/* Dev-only gallery server (`bun run dev:gallery`). The publishable library
 * build stays in vite.config.ts; this config never ships anything. */

const ICON_PREFIXES = ["lucide", "mdi", "simple-icons"];
const ICONS_ID = "virtual:gallery-icons";
const RESOLVED_ICONS_ID = `\0${ICONS_ID}`;
const require = createRequire(import.meta.url);

function sources(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) return sources(path);
		return [".ts", ".tsx"].includes(extname(entry.name)) ? [path] : [];
	});
}

function namedIcons(dirs: string[]): Set<string> {
	const pattern = new RegExp(`(?:${ICON_PREFIXES.join("|")}):[a-z0-9-]+`, "g");
	const names = new Set<string>();
	for (const dir of dirs) {
		for (const file of sources(dir)) {
			for (const match of readFileSync(file, "utf-8").matchAll(pattern)) names.add(match[0]);
		}
	}
	return names;
}

function iconModule(dirs: string[], warn: (message: string) => void): string {
	const sets = new Map<string, IconifyJSON>();
	const bundled: Record<string, IconifyIcon> = {};
	for (const name of [...namedIcons(dirs)].sort()) {
		const [prefix = "", ...rest] = name.split(":");
		if (!sets.has(prefix)) {
			sets.set(
				prefix,
				JSON.parse(
					readFileSync(require.resolve(`@iconify-json/${prefix}/icons.json`), "utf-8"),
				) as IconifyJSON,
			);
		}
		const set = sets.get(prefix);
		const data = set ? getIconData(set, rest.join(":")) : null;
		if (!data) {
			warn(`[gallery-icons] "${name}" is not in @iconify-json/${prefix}`);
			continue;
		}
		bundled[name] = data;
	}
	return `export const bundled = ${JSON.stringify(bundled)};\n`;
}

/** `virtual:gallery-icons` carries the icon data for every `prefix:name` the
 *  gallery and the components it renders name, so nothing is fetched at runtime
 *  and no whole set is bundled. */
function galleryIcons(): Plugin {
	const dirs = [join(import.meta.dirname, "dev"), join(import.meta.dirname, "src")];
	return {
		name: "gallery-icons",
		resolveId(id) {
			if (id === ICONS_ID) return RESOLVED_ICONS_ID;
		},
		load(id) {
			if (id === RESOLVED_ICONS_ID) return iconModule(dirs, (message) => this.warn(message));
		},
	};
}

export default defineConfig({
	root: "dev",
	plugins: [solid(), tailwindcss(), galleryIcons()],
	resolve: {
		conditions: ["@glasshome/source"],
	},
	server: {
		port: 5199,
	},
	build: {
		rollupOptions: {
			input: {
				index: join(import.meta.dirname, "dev", "index.html"),
				stage: join(import.meta.dirname, "dev", "stage.html"),
			},
		},
	},
});
