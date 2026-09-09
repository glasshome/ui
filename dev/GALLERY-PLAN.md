# Gallery rebuild implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give `@glasshome/ui`'s gallery a Foundations area and a Screens area, and put every component specimen on one grammar.

**Architecture:** Three areas behind a hash router, navigated by the package's own `<Dock>`. Foundations parses `theme.css` through a parser exported from `src/tokens/`. Components stays one page. Screens render in an iframe at a real viewport size and are built from named exported sub-blocks.

**Tech Stack:** SolidJS 1.9, Vite 8, Tailwind 4, Kobalte, Playwright, vitest + happy-dom, TypeScript 7.

**Spec:** `packages/public/ui/dev/GALLERY.md`

## Global constraints

- Repo: the `@glasshome/ui` submodule at `packages/public/ui`, branch `gallery`. Every git command runs from that directory. Never `git add -A`; pass explicit paths to `git commit`.
- Package manager `bun`. Lint is `biome`, not oxlint: `bun run lint`.
- Comments default to zero. One short line only for a constraint the code cannot express.
- No app-local CSS custom properties. Colour, radius and motion come from `theme.css` names.
- No `as any`. No `!` on signal accessors. No `async` in `createEffect`. No prop destructuring; always `props.x`.
- Everything under `dev/` is dev-only and never published. `package.json` `files` does not include it.
- After each task: `bun run check:types && bun run lint`.
- Never bump the package version. Never tag. Never publish.

---

### Task 1: Put the gallery under typecheck

**Files:**
- Modify: `tsconfig.test.json:10`
- Modify: `tsconfig.json:26`
- Modify: `dev/groups/OverlaysCatalog.tsx:205,361`
- Modify: `dev/GlassPlayground.tsx`, `dev/groups/PickersCatalog.tsx`
- Modify: `dev/main.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: a gallery that `bun run check:types` covers. Every later task depends on this.

- [ ] **Step 1: Add `dev/` to the typecheck project**

In `tsconfig.test.json`, change `"include"` to:

```json
"include": ["src/**/*", "tests/**/*", "dev/**/*", "vitest.config.ts"]
```

In `tsconfig.json`, change `"types": ["node"]` to:

```json
"types": ["node", "vite/client"]
```

- [ ] **Step 2: Run the typecheck and capture the failures**

Run: `bun run check:types`
Expected: FAIL, roughly 12 errors across `dev/`.

- [ ] **Step 3: Fix the two real API misuses**

`dev/groups/OverlaysCatalog.tsx:205` and `:361` pass `variant` to a `<Button as={…}>`. `Button`'s `as` form does not take `variant`. Move the styling to the wrapped element's own class, or drop `as` and keep `variant`. Read both call sites and pick whichever preserves the rendered specimen.

- [ ] **Step 4: Fix the index-access errors**

`dev/GlassPlayground.tsx` and `dev/groups/PickersCatalog.tsx` fail `noUncheckedIndexedAccess`. Guard each read; never use `!`:

```tsx
const first = items[0];
if (!first) return null;
```

- [ ] **Step 5: Give the gallery real icons**

`dev/main.tsx` never calls `provideIcons`, so every `<Icon>` in the gallery renders the empty `viewBox="0 0 16 16"` placeholder. Add, above `render(...)`:

```tsx
import { provideIcons } from "../src/solid/icon.js";
import lucide from "@iconify-json/lucide/icons.json" with { type: "json" };

provideIcons({ bundled: lucide });
```

If `@iconify-json/lucide` is not a devDependency, add it with `bun add -D @iconify-json/lucide`. Check how `tests/setup.ts` shapes the argument and match it.

- [ ] **Step 6: Verify**

Run: `bun run check:types && bun run lint && bun run dev:gallery`
Expected: typecheck passes, and icons render as glyphs rather than empty boxes.

- [ ] **Step 7: Commit**

```bash
git commit -m "fix(gallery): typecheck dev/ and provide icons" -- tsconfig.json tsconfig.test.json dev/
```

---

### Task 2: Export the theme parser and contrast helper

**Files:**
- Create: `src/tokens/theme-css.ts`
- Create: `tests/tokens/theme-css.test.ts`
- Modify: `src/tokens/index.ts`
- Modify: `scripts/check-tokens.ts:26-34`
- Modify: `tests/tokens/contrast.test.ts:19-53`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `parseThemeBlock(css: string, block: string): Record<string, string>`
  - `contrastRatio(oklchA: string, oklchB: string): number`
  Both exported from `src/tokens/index.ts`. Task 7 (Foundations) consumes both.

- [ ] **Step 1: Write the failing test**

Create `tests/tokens/theme-css.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { contrastRatio, parseThemeBlock } from "../../src/tokens";

const CSS = `
:root {
  --background: oklch(0.99 0 0);
  --foreground: oklch(0.2 0 0);
  --radius-md: 0.75rem;
}
.dark {
  --background: oklch(0.17 0 0);
}
`;

describe("parseThemeBlock", () => {
  it("reads every declaration in a block", () => {
    const vars = parseThemeBlock(CSS, ":root");
    expect(vars["--background"]).toBe("oklch(0.99 0 0)");
    expect(vars["--radius-md"]).toBe("0.75rem");
  });

  it("reads the dark block separately", () => {
    expect(parseThemeBlock(CSS, ".dark")["--background"]).toBe("oklch(0.17 0 0)");
  });

  it("throws on a missing block", () => {
    expect(() => parseThemeBlock(CSS, ".nope")).toThrow(/block not found/);
  });
});

describe("contrastRatio", () => {
  it("is 21 for black against white", () => {
    expect(contrastRatio("oklch(1 0 0)", "oklch(0 0 0)")).toBeCloseTo(21, 0);
  });

  it("is symmetric", () => {
    const a = contrastRatio("oklch(0.99 0 0)", "oklch(0.2 0 0)");
    const b = contrastRatio("oklch(0.2 0 0)", "oklch(0.99 0 0)");
    expect(a).toBeCloseTo(b, 5);
  });
});
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `bunx vitest run tests/tokens/theme-css.test.ts`
Expected: FAIL, `parseThemeBlock` is not exported.

- [ ] **Step 3: Write the module**

Create `src/tokens/theme-css.ts`:

```ts
import { oklchToHex } from "./hex.js";

/** Every custom property declared in one theme.css block (`:root`, `.dark`). */
export function parseThemeBlock(css: string, block: string): Record<string, string> {
	const match = css.match(new RegExp(`${block.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\{([^}]*)\\}`));
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
		.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)) as [number, number, number];
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast between two oklch() literals. */
export function contrastRatio(a: string, b: string): number {
	const [x, y] = [luminance(a), luminance(b)];
	return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
```

Add to `src/tokens/index.ts`:

```ts
export { contrastRatio, parseThemeBlock } from "./theme-css.js";
```

- [ ] **Step 4: Run the test**

Run: `bunx vitest run tests/tokens/theme-css.test.ts`
Expected: PASS.

- [ ] **Step 5: Delete the two duplicate parsers**

In `scripts/check-tokens.ts`, delete the local `cssVars` function and use `parseThemeBlock(css, block)`.
In `tests/tokens/contrast.test.ts`, delete the local `themeVars`, `luminance` and `contrast` functions and use `parseThemeBlock` and `contrastRatio`. Keep the `role()` guard: it throws a better message. Note that `themeVars` only matched `oklch(...)` values while `parseThemeBlock` matches every declaration, so `role()` now also has to reject a non-oklch value:

```ts
function role(vars: Record<string, string>, name: string): string {
	const value = vars[name];
	if (!value?.startsWith("oklch(")) {
		throw new Error(`theme.css does not declare ${name} as a literal oklch()`);
	}
	return value;
}
```

- [ ] **Step 6: Verify nothing regressed**

Run: `bun run check:tokens && bunx vitest run tests/tokens && bun run check:types`
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git commit -m "refactor(tokens): one theme.css parser and contrast helper" -- src/tokens scripts/check-tokens.ts tests/tokens
```

---

### Task 3: The shell, the router and the dock

**Files:**
- Create: `dev/routes.ts`
- Rewrite: `dev/main.tsx`
- Modify: `dev/PackageCatalog.tsx`

**Interfaces:**
- Consumes: Task 1.
- Produces:
  - `dev/routes.ts` exporting `type Area = { id: string; title: string; icon: string; entries: Entry[] }`, `type Entry = { id: string; title: string; component: Component }`, and `const AREAS: Area[]`.
  - Route grammar: `#/`, `#/<areaId>`, `#/<areaId>/<entryId>`, plus `#/all`.
  Tasks 5, 7, 9, 10, 11 register entries here.

- [ ] **Step 1: Write `dev/routes.ts`**

```ts
import type { Component } from "solid-js";
import PackageCatalog from "./PackageCatalog";

export interface Entry {
	id: string;
	title: string;
	component: Component;
}

export interface Area {
	id: string;
	title: string;
	icon: string;
	entries: Entry[];
}

export const AREAS: Area[] = [
	{ id: "foundations", title: "Foundations", icon: "lucide:palette", entries: [] },
	{
		id: "components",
		title: "Components",
		icon: "lucide:box",
		entries: [{ id: "all", title: "All components", component: PackageCatalog }],
	},
	{ id: "screens", title: "Screens", icon: "lucide:layout-dashboard", entries: [] },
];

export function findEntry(areaId: string, entryId: string): Entry | undefined {
	return AREAS.find((a) => a.id === areaId)?.entries.find((e) => e.id === entryId);
}
```

- [ ] **Step 2: Rewrite `dev/main.tsx`**

Keep the existing theme toggle behaviour. Replace the body with a hash router, the dock, and a labelled entry list.

```tsx
import { createSignal, For, onCleanup, Show } from "solid-js";
import { Dynamic, render } from "solid-js/web";
import { Button, Dock, Icon, Toaster } from "../src/solid";
import { provideIcons } from "../src/solid/icon.js";
import { AREAS, findEntry } from "./routes";
import "./styles.css";

function useHash() {
	const read = () => window.location.hash.replace(/^#\/?/, "");
	const [hash, setHash] = createSignal(read());
	const onChange = () => setHash(read());
	window.addEventListener("hashchange", onChange);
	onCleanup(() => window.removeEventListener("hashchange", onChange));
	return hash;
}

function Gallery() {
	const hash = useHash();
	const [dark, setDark] = createSignal(window.matchMedia("(prefers-color-scheme: dark)").matches);
	const apply = (d: boolean) => {
		setDark(d);
		document.documentElement.classList.toggle("dark", d);
	};
	apply(dark());

	const parts = () => hash().split("/").filter(Boolean);
	const areaId = () => parts()[0] ?? "";
	const entryId = () => parts()[1] ?? "";
	const area = () => AREAS.find((a) => a.id === areaId());
	const entry = () => findEntry(areaId(), entryId());

	const dockItems = () =>
		AREAS.map((a) => ({
			id: a.id,
			icon: <Icon icon={a.icon} width="24" height="24" />,
			label: a.title,
			isActive: a.id === areaId(),
			onClick: () => {
				window.location.hash = `#/${a.id}/${a.entries[0]?.id ?? ""}`;
			},
		}));

	return (
		<div class="min-h-screen bg-background pb-28 text-foreground">
			<header class="sticky top-0 z-50 flex items-center justify-between gap-4 border-border/50 border-b bg-background/80 px-6 py-3 backdrop-blur-md">
				<span class="font-bold text-lg">@glasshome/ui</span>
				<Button variant="outline" size="sm" onClick={() => apply(!dark())}>
					<Show when={dark()} fallback={"Dark"}>Light</Show>
				</Button>
			</header>
			<Show when={area()} fallback={<AreaIndex />}>
				{(current) => (
					<main class="mx-auto max-w-6xl px-6 py-6">
						<Show when={current().entries.length > 1}>
							<nav class="mb-5 flex flex-wrap gap-2">
								<For each={current().entries}>
									{(e) => (
										<Button
											variant={e.id === entryId() ? "secondary" : "ghost"}
											size="sm"
											onClick={() => {
												window.location.hash = `#/${current().id}/${e.id}`;
											}}
										>
											{e.title}
										</Button>
									)}
								</For>
							</nav>
						</Show>
						<Show when={entry()}>{(e) => <Dynamic component={e().component} />}</Show>
					</main>
				)}
			</Show>
			<nav class="fixed bottom-4 left-1/2 z-50 -translate-x-1/2" aria-label="Gallery areas">
				<Dock items={dockItems()} dockMode="floating" />
			</nav>
			<Toaster />
		</div>
	);
}
```

`AreaIndex` is a small component rendering one `Button` per area, shown at `#/`. Write it in the same file.

- [ ] **Step 3: Keep the shoot-everything route working**

`shoot.mjs` loads `/` and expects every `[data-specimen]` cell present. Add to the router: when `hash()` is `all`, render `<PackageCatalog />` with no chrome. Screens and Foundations are excluded from that route on purpose; only specimens live there.

- [ ] **Step 4: Verify by eye**

Run: `bun run dev:gallery`
Check: `#/` shows three areas, the dock switches area, `#/components/all` lists every group, the back/forward buttons move between routes, and `#/all` renders the bare catalog.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(gallery): three areas behind a hash router" -- dev/main.tsx dev/routes.ts dev/PackageCatalog.tsx
```

---

### Task 4: Fixtures

**Files:**
- Create: `dev/fixtures.tsx` (a `.tsx`, since it exports `DemoHost`)
- Modify: `dev/groups/PickersCatalog.tsx:60-121`

**Interfaces:**
- Consumes: Task 1.
- Produces, all from `dev/fixtures.tsx`:
  - `demoAdapter: EntityDataAdapter`
  - `DEMO_AREAS: AreaViewLike[]`, `DEMO_ENTITIES: EntityViewLike[]`
  - `DEMO_PEOPLE: { id: string; name: string; avatar?: string }[]`
  - `DEMO_WIDGETS: { id: string; title: string; icon: string; w: number; h: number }[]`
  - `<DemoHost>`, a component wrapping children in `EntityDataContext.Provider value={demoAdapter}`
  Tasks 9, 10, 11 consume `DemoHost` and the demo arrays.

- [ ] **Step 1: Move the existing adapter out of the pickers group**

`dev/groups/PickersCatalog.tsx` already defines `DEMO_ENTITIES`, `DEMO_BY_ID`, `DEMO_AREAS` and `demoAdapter`. Cut them into `dev/fixtures.tsx` unchanged, export them, and import them back in `PickersCatalog.tsx`.

- [ ] **Step 2: Add `DemoHost`**

```tsx
import type { JSX } from "solid-js";
import { EntityDataContext } from "../src/solid/entity-data.js";

export function DemoHost(props: { children: JSX.Element }) {
	return <EntityDataContext.Provider value={demoAdapter}>{props.children}</EntityDataContext.Provider>;
}
```

- [ ] **Step 3: Add the demo data the screens need**

Homeowner-plausible, no lorem: areas Living room, Kitchen, Bedroom, Office; entities across `light`, `switch`, `sensor`, `media_player`; four people with names; six widgets with titles, lucide icon names and grid sizes.

- [ ] **Step 4: Verify**

Run: `bun run check:types && bun run dev:gallery`
Check: the Pickers group still renders live area and entity pickers.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(gallery): shared demo fixtures" -- dev/fixtures.tsx dev/groups/PickersCatalog.tsx
```

---

### Task 5: The specimen grammar

**Files:**
- Rewrite: `dev/CatalogKit.tsx`

**Interfaces:**
- Consumes: Task 1.
- Produces:
  - `<CatalogGroup id title>` (unchanged signature)
  - `<Specimen name span? try? state?>` replacing `CatalogItem`
  - `<Axis of>` where `of: string` is a real prop name
  - `CatalogItem` and `CatalogNote` are deleted in Task 6, not here; keep them exported until then so the tree still builds.

- [ ] **Step 1: Write the new parts**

```tsx
/** One specimen cell. `name` is the exported identifier. */
export function Specimen(props: {
	name: string;
	/** The interaction the specimen needs; shoot.mjs reads it as --click / --hover. */
	try?: string;
	/** A live value worth showing (a select's value, a toggle's pressed). */
	state?: string;
	span?: 2 | 3;
	children: JSX.Element;
}) {
	const spanClass =
		props.span === 3 ? "sm:col-span-2 lg:col-span-3" : props.span === 2 ? "sm:col-span-2" : "";
	return (
		<div
			data-specimen={props.name}
			data-try={props.try}
			// Opaque on purpose: glass specimens need a known backdrop.
			class={`flex flex-col overflow-hidden rounded-lg border border-border/60 bg-card ${spanClass}`}
		>
			<div class="flex items-baseline justify-between gap-2 border-border/50 border-b bg-muted/30 px-3 py-1.5">
				<code class="font-mono font-semibold text-foreground text-xs">{props.name}</code>
				<Show when={props.state ?? props.try}>
					{(chip) => <span class="truncate text-[10px] text-muted-foreground">{chip()}</span>}
				</Show>
			</div>
			<div class="flex min-h-24 flex-1 flex-col">{props.children}</div>
		</div>
	);
}

/** One prop axis inside a specimen. `of` is the component's real prop name. */
export function Axis(props: { of: string; children: JSX.Element }) {
	return (
		<div class="flex flex-wrap items-center gap-3 border-border/40 border-b p-3 last:border-b-0">
			<span class="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
				{props.of}
			</span>
			{props.children}
		</div>
	);
}
```

- [ ] **Step 2: Verify in the browser**

Run: `bun run dev:gallery`
Check: nothing changed yet, since no group uses `Specimen` before Task 6.

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(gallery): Specimen and Axis" -- dev/CatalogKit.tsx
```

---

### Task 6a: Migrate groups, batch one

**Files:**
- Modify: `dev/groups/GlassCatalog.tsx`, `ActionsCatalog.tsx`, `FormsCatalog.tsx`, `DataCatalog.tsx`, `WidgetCardCatalog.tsx`, `FeedbackCatalog.tsx`

**Interfaces:**
- Consumes: `Specimen`, `Axis` from Task 5.
- Produces: nothing later tasks import.

- [ ] **Step 1: Rewrite every `CatalogItem` as a `Specimen`**

For each cell:
- `name` stays, unless it is not an export name. Rename `DataTable empty` to `DataTable` with a second `Axis of="state"`; rename `Sonner` to `Toaster`; `Thumbs` to `CarouselThumbs` if that is the export, otherwise fold it into `Carousel`. Read `src/solid/index.ts` and use the real name.
- A `hint` naming variants becomes `<Axis of="variant">`. A `hint` naming an interaction becomes `try=`. A `hint` showing a live value becomes `state=`.
- Each `CatalogNote` row becomes an `<Axis of="…">` with the axis's real prop name.

- [ ] **Step 2: Rehome the invariants, same commit**

Some `CatalogNote` texts are constraints recorded nowhere else, for example "wipe stacks its slides in one grid cell, which collapses every scroll snap onto one point, so wipe cannot be dragged", "rows are glass on glass, never a flat `bg-card/60` plate", "the card owns the padding; the parts carry none", "counts over 9 read as 9+". For each, put one line in the component's own source file (a `//` line above the constraint it describes) or a row in `SPEC.md`'s relevant table. One home each. Do not delete without rehoming; do not put it in two places.

- [ ] **Step 3: Verify**

Run: `bun run check:types && bun run lint && bun run gallery:shots --no-build`
Expected: typecheck and lint pass, shots exit 0 with no page errors.

- [ ] **Step 4: Commit**

```bash
git commit -m "refactor(gallery): one grammar for glass, actions, forms, data, widget card, feedback" -- dev/groups src/solid SPEC.md
```

---

### Task 6b: Migrate groups, batch two

**Files:**
- Modify: `dev/groups/NavCatalog.tsx`, `OverlaysCatalog.tsx`, `LayoutCatalog.tsx`, `PickersCatalog.tsx`, `AppKitCatalog.tsx`
- Modify: `dev/CatalogKit.tsx` (delete `CatalogItem` and `CatalogNote` once nothing imports them)

**Interfaces:**
- Consumes: `Specimen`, `Axis` from Task 5; `DemoHost` from Task 4.
- Produces: `CatalogKit.tsx` exporting only `CatalogGroup`, `Specimen`, `Axis`.

- [ ] **Step 1: Same migration as Task 6a for these five files**

`OverlaysCatalog.tsx` carries most of the interaction hints ("modal · click to open", "right-click", "drag-to-dismiss · click to open", "click Actions"). Every one becomes `try=`, with the exact trigger text `shoot.mjs` will click.

- [ ] **Step 2: Have `PickersCatalog` use `DemoHost`**

Replace its inline `EntityDataContext.Provider` with `<DemoHost>`.

- [ ] **Step 3: Delete the old parts**

Run: `grep -rn "CatalogItem\|CatalogNote" dev/`
Expected: no hits. Then delete both from `dev/CatalogKit.tsx`.

- [ ] **Step 4: Verify**

Run: `bun run check:types && bun run lint && bun run check:dead && bun run gallery:shots --no-build`
Expected: all pass, no page errors.

- [ ] **Step 5: Commit**

```bash
git commit -m "refactor(gallery): one grammar for nav, overlays, layout, pickers, app kit" -- dev/groups dev/CatalogKit.tsx src/solid SPEC.md
```

---

### Task 7: Foundations

**Files:**
- Create: `dev/foundations/ColourRoles.tsx`, `Radii.tsx`, `Elevation.tsx`, `Motion.tsx`, `Surfaces.tsx`
- Move: `dev/GlassPlayground.tsx` to `dev/foundations/GlassPlayground.tsx`
- Modify: `dev/groups/GlassCatalog.tsx` (drop the playground and the hand-kept `KNOBS`)
- Do NOT modify `dev/routes.ts`; Task 14 wires every entry in one edit.

**Interfaces:**
- Consumes: `parseThemeBlock`, `contrastRatio` from Task 2; the route registry from Task 3.
- Produces: six entries under the `foundations` area.

- [ ] **Step 1: Read theme.css at build time**

Vite inlines a `?raw` import, so no fetch and no parser at runtime beyond the one function:

```tsx
import themeCss from "../../src/styles/theme.css?raw";
import { contrastRatio, parseThemeBlock } from "../../src/tokens";

const LIGHT = parseThemeBlock(themeCss, ":root");
const DARK = parseThemeBlock(themeCss, ".dark");
```

- [ ] **Step 2: `ColourRoles.tsx`**

One swatch per role, in both themes, each labelled with its variable name and its measured contrast against that theme's `--background`. Roles: `--foreground`, `--muted-foreground`, `--primary`, `--accent`, `--secondary`, `--border`, `--ring`, `--success`, `--warning`, `--destructive`, `--love`, `--chart-1` through `--chart-5`. Skip any whose value is not an `oklch(` literal rather than throwing; a role defined by `color-mix` has no single ratio.

- [ ] **Step 3: `Radii.tsx`, `Elevation.tsx`, `Motion.tsx`**

`Radii`: one box per `--radius-*` found in the parsed block, labelled with name and value.
`Elevation`: one card per shadow token found.
`Motion`: one row per `--duration-*` / `--ease-*` pair, each with a button that toggles a class so the sample animates on that pair. No inline animation strings; use the classes in `src/lib/motion-classes.ts`.

- [ ] **Step 4: `Surfaces.tsx`**

Six panels over one shared decorative ground, each wearing exactly one recipe imported from `src/index.ts`: `CARD_SURFACE`, `OVERLAY_SURFACE`, `INPUT_SURFACE`, `FIELD_CHROME`, `TRACK_SURFACE`, `SCRIM_CLASS`. Label each with the export name.

- [ ] **Step 5: Derive the glass knobs**

`dev/groups/GlassCatalog.tsx:25` holds a hand-kept `KNOBS` list of five of SPEC's fourteen, and it has drifted from `SPEC.md` (`--glass-wash` 20% against SPEC's 28%, `--glass-lift` 0.45 against 0). Move the playground to `dev/foundations/`, and read each knob's default from the parsed theme block rather than retyping it. A knob SPEC documents but `theme.css` does not declare is listed with its value read from `getComputedStyle(document.documentElement)`.

- [ ] **Step 7: Verify in pixels**

Run: `bun run dev:gallery`, open `#/foundations/colour-roles`, then toggle the theme.
Check: swatches match what dash renders, contrast numbers are plausible (`--foreground` well above 10, semantic roles above 4.5), and no role renders as white because its value failed to parse.

- [ ] **Step 8: Commit**

```bash
git commit -m "feat(gallery): foundations area" -- dev/foundations dev/groups/GlassCatalog.tsx dev/routes.ts
```

---

### Task 8: The iframe width stage

**Files:**
- Create: `dev/Stage.tsx`
- Create: `dev/stage.html`
- Create: `dev/stage.tsx`
- Modify: `dev/main.tsx`
- Modify: `vite.dev.config.ts`

**Interfaces:**
- Consumes: Task 3's router.
- Produces: `<Stage route={string}>`, used by the screens area. Widths: `phone` 390x844, `tablet` 834x1112, `desktop` 1280x900.

- [ ] **Step 1: Add a second entry point**

`dev/stage.html` loads `dev/stage.tsx`, which mounts one entry by reading its own hash, with no dock and no header. Register it in `vite.dev.config.ts`'s `build.rollupOptions.input` beside the main `index.html`.

- [ ] **Step 2: Write `Stage.tsx`**

An `<iframe src={`/stage.html#/${props.route}`}>` sized to the selected width, with the width buttons above it. The iframe carries the parent's theme through a query parameter, since a class on the parent's `documentElement` does not cross the boundary.

- [ ] **Step 3: Verify the axis is honest**

Run: `bun run dev:gallery`, open a screens entry at `phone`, open a modal inside it.
Check: the dialog is phone-width and sits inside the iframe. This is the whole point of the iframe; if the modal escapes, the stage is wrong.

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(gallery): iframe width stage" -- dev/Stage.tsx dev/stage.html dev/stage.tsx dev/main.tsx vite.dev.config.ts
```

---

### Task 9: Screens, batch one

**Files:**
- Create: `dev/screens/settings-shape.tsx`, `dev/screens/wizard-shape.tsx`
- Do NOT modify `dev/routes.ts`; Task 14 wires every entry in one edit.

**Interfaces:**
- Consumes: `DemoHost`, `DEMO_AREAS`, `DEMO_PEOPLE` from Task 4.
- Produces: from `settings-shape.tsx`, `export function FieldGroup(props)` and `export function DangerZone(props)`; from `wizard-shape.tsx`, `export function ChoiceStep(props)`. Default export per file is the whole screen.

- [ ] **Step 1: `settings-shape.tsx`**

Sections built from `SectionCard` with `icon`, `title`, `subtitle`, `count` and `action`; rows from `SectionRow`; a `FieldSet` + `FieldLegend` + `FieldDescription` + `FieldSubGroup` group; switches, selects and a slider; and a destructive zone. Export `FieldGroup` and `DangerZone` as standalone components, then compose them in the default export. Nothing hand-rolls a panel, a row, a chip or a callout: every one comes from an export.

- [ ] **Step 2: `wizard-shape.tsx`**

`StepIndicator` with `count` and `index`, `OptionCardGroup` + `OptionCard` for the choice, a header and a footer action pair. Export `ChoiceStep`.

- [ ] **Step 4: Verify in pixels at three widths**

Run: `bun run gallery:shots --route screens/settings-shape --stage phone`, then `tablet`, then `desktop`.
Check each decoded PNG: rows do not overflow at phone width, the danger zone reads as destructive in both themes, and no page errors.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat(gallery): settings and wizard screens" -- dev/screens dev/routes.ts
```

---

### Task 10: Screens, batch two

**Files:**
- Create: `dev/screens/dashboard-shape.tsx`, `dev/screens/entity-modal-shape.tsx`
- Do NOT modify `dev/routes.ts`; Task 14 wires every entry in one edit.

**Interfaces:**
- Consumes: `DemoHost`, `DEMO_WIDGETS`, `DEMO_ENTITIES` from Task 4.
- Produces: from `entity-modal-shape.tsx`, `export function ModalForm(props)` and `export function ListTriad(props)`.

- [ ] **Step 1: `dashboard-shape.tsx`**

A decorative wallpaper ground, a grid of `WidgetCard`s in both `layout="tile"` and `layout="row"`, and a floating `Dock`. The dock here is a specimen of the package's dock, not the gallery's own nav; render it inside the screen.

- [ ] **Step 2: `entity-modal-shape.tsx`**

A `ResponsiveDialog` with a header carrying `media`, a `Body as="form" id="…"`, and a footer button with `form="…"`. Beside it, `ListTriad`: the same list in three states, loaded, `Empty` with its parts, and `SectionRowSkeletons`. Export `ModalForm` and `ListTriad`.

- [ ] **Step 3: Verify in pixels, same as Task 9**

Shoot each at all three stages, decode and look. The modal at `phone` must be the bottom-sheet form, which is the case the iframe exists for.

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(gallery): dashboard and entity modal screens" -- dev/screens dev/routes.ts
```

---

### Task 11: shoot.mjs

**Files:**
- Modify: `dev/shoot.mjs:33,90-140`

**Interfaces:**
- Consumes: Task 3's routes, Task 8's stage.
- Produces: `--route`, `--stage`, `--reduced-motion`.

- [ ] **Step 1: Add the flags**

`--stage phone|tablet|desktop` maps to a viewport pair and overrides `width`/`height`. Do not reuse `--width`: it is already `Number(flag("width", 1280))` at line 33, so `--width phone` produces `viewport: { width: NaN }` and an `@NaN` filename.

```js
const STAGES = { phone: [390, 844], tablet: [834, 1112], desktop: [1280, 900] };
const stage = flag("stage", null);
const [stageW, stageH] = STAGES[stage] ?? [];
```

- [ ] **Step 2: Add the route path**

When `--route` is given, `goto` `http://gallery.local/stage.html#/<route>`, wait for the settle condition, and take one full-page screenshot named for the route and stage. The existing `[data-specimen]` loop must not run in this mode: it would find no cells and exit 0 having written nothing.

- [ ] **Step 3: Settle deliberately**

Replace the blind `waitForTimeout(800)` on the route path with waiting for `[data-screen]` to be visible, then one animation frame past the longest `--duration-*`. Screens stagger their rows in, so a shot taken too early catches a half-arrived list.

- [ ] **Step 4: `--reduced-motion`**

```js
if (flag("reduced-motion", false) === true) await page.emulateMedia({ reducedMotion: "reduce" });
```

- [ ] **Step 5: Verify all three modes**

```bash
bun run gallery:shots Button                                  # unchanged behaviour
bun run gallery:shots --route screens/settings-shape --stage phone
bun run gallery:shots --route screens/wizard-shape --reduced-motion
```
Decode each output PNG and look at it. A zero-byte or blank shot is a failure, not a pass.

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(gallery): shoot routes and stages" -- dev/shoot.mjs
```

---

### Task 12: The coverage gate

**Files:**
- Create: `scripts/check-gallery.ts`
- Create: `dev/coverage-allow.ts`
- Create: `tests/gallery-coverage.test.ts`
- Modify: `package.json` (scripts)
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: every specimen from Tasks 6a and 6b.
- Produces: `bun run check:gallery`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { uncoveredExports } from "../scripts/check-gallery";

describe("gallery coverage", () => {
  it("every component-valued export has a specimen", () => {
    expect(uncoveredExports()).toEqual([]);
  });
});
```

- [ ] **Step 2: Write the script**

`uncoveredExports()` returns names that fail either rule:
1. A component-valued export from `src/solid/index.ts` with no `<Specimen name="…">` anywhere under `dev/`. Resolve each export to its declaration file and keep only those whose declaration is a component (a function returning JSX). Exclude `export type` names and `SCREAMING_CASE` identifiers by rule, never by an allowlist entry.
2. A `<Specimen name>` that is not an export name.

Both lists are filtered through `dev/coverage-allow.ts`:

```ts
/** Exports with no specimen, each with the reason. Reasons are a backlog. */
export const ALLOW: Array<[name: string, reason: string]> = [];
```

The script fails if any allow entry has an empty reason, and if any allow entry names an export that is now covered (a stale allowlist is the failure mode this rule prevents).

- [ ] **Step 3: Run it and empty the allowlist honestly**

Run: `bun scripts/check-gallery.ts`
Every reported name is either a missing specimen (add it in the group it belongs to) or a genuine exclusion (add it to `ALLOW` with a reason worth reading). Do not add entries in bulk to make the run green.

- [ ] **Step 4: Wire it up**

Add to `package.json` scripts: `"check:gallery": "bun scripts/check-gallery.ts"`. Add a step to `.github/workflows/ci.yml` beside the other `bun run` checks.

- [ ] **Step 5: Verify it fails when it should**

Delete one `<Specimen>` temporarily, run `bun run check:gallery`, confirm a non-zero exit naming that export, then restore it.

- [ ] **Step 6: Commit**

```bash
git commit -m "feat(gallery): specimen coverage gate" -- scripts/check-gallery.ts dev/coverage-allow.ts tests/gallery-coverage.test.ts package.json .github/workflows/ci.yml
```

---

### Task 13: The agent's pointer table

**Files:**
- Modify: `/home/ihsen/Documents/repos/glasshome/dash/.claude/skills/glasshome-ui/SKILL.md`

**Interfaces:**
- Consumes: the sub-block names from Tasks 9 and 10.

**This task commits in the dash repository, not the submodule.**

- [ ] **Step 1: Add the table**

Under "Resolve every surface before writing code", add:

```markdown
## Compositions, whole

Screens in `packages/public/ui/dev/screens/` show how the bricks compose. Each
exports named sub-blocks; lift the block, not the page.

| Need | Read |
| --- | --- |
| a settings page, sections and rows | `settings-shape.tsx` (`FieldGroup`, `DangerZone`) |
| a wizard step | `wizard-shape.tsx` (`ChoiceStep`) |
| a dashboard ground with widgets | `dashboard-shape.tsx` |
| a modal with a form, a list's three states | `entity-modal-shape.tsx` (`ModalForm`, `ListTriad`) |

A screen documents the package, not dash. It will drift from dash's real
settings page; it is not dash's spec.
```

- [ ] **Step 2: Commit in the dash repo**

```bash
cd /home/ihsen/Documents/repos/glasshome/dash
git commit -m "docs(skill): point at the ui gallery's screen compositions" -- .claude/skills/glasshome-ui/SKILL.md
```

---

### Task 14: Wire every entry into the router

**Files:**
- Modify: `dev/routes.ts`

**Interfaces:**
- Consumes: the components from Tasks 7, 9 and 10, and `Stage` from Task 8.

- [ ] **Step 1: Fill both empty areas**

`foundations`: the six components from Task 7. `screens`: the four from Tasks 9 and 10, each wrapped so the main entry point renders it inside `<Stage route="screens/<id>">` while `stage.html` renders it bare.

- [ ] **Step 2: Walk every route by hand**

Run: `bun run dev:gallery`, click every dock item and every entry.
Expected: no blank panes, no console errors.

- [ ] **Step 3: Commit**

```bash
git commit -m "feat(gallery): wire foundations and screens routes" -- dev/routes.ts
```

---

## Done when

- `bun run check:types && bun run lint && bun run check:dead && bun run check:tokens && bun run check:gallery` all pass in `packages/public/ui`.
- `bun run gallery:shots --no-build` exits 0.
- Each of the four screens has been shot at `phone`, `tablet` and `desktop`, decoded and looked at.
- The submodule pointer in dash is NOT advanced, and nothing is published. That is a separate decision for the owner.
