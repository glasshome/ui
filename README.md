# @glasshome/ui

SolidJS component library for GlassHome, built on [Kobalte](https://kobalte.dev).

70+ accessible, theme-aware components plus framework-agnostic design tokens and a Tailwind v4 CSS preset, everything you need to build smart-home dashboards. Powers [GlassHome](https://glasshome.app), the local-first dashboard for Home Assistant.

The whole library wears a single glass material (`.glass` with typed `--glass-*` knobs). `SPEC.md` is the design-system contract; the live gallery (`bun run dev:gallery`) is its executable form.

## Install

```bash
bun add @glasshome/ui solid-js @glasshome/sync-layer
# or
npm install @glasshome/ui solid-js @glasshome/sync-layer
```

Peer dependencies:

| Package | Needed for |
| --- | --- |
| `solid-js` `^1.9` | everything under `/solid` |
| `@glasshome/sync-layer` | `/solid` only (EntitySelector, AreaPicker, demo-mode helpers) |

The package is **ESM-only** and ships modern ESM with type declarations that resolve under both bundler and Node 16+ module resolution. Node `>=20`.

## Entry points

### `@glasshome/ui` — utilities and surface recipes

Framework-agnostic root: class-string recipes for the sanctioned glass surfaces, safe to import from server code (e.g. Astro frontmatter) where Solid components cannot run.

```typescript
import { cn, buttonVariants, CARD_SURFACE, ALERT_TONES, OVERLAY_SURFACE } from "@glasshome/ui";

const cls = cn("px-4 py-2", condition && "text-white");
const btn = buttonVariants({ variant: "outline", size: "sm" });
```

### `@glasshome/ui/solid` — components

All components are exported from a single subpath.

```tsx
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from "@glasshome/ui/solid";

function DeviceCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Living Room</CardTitle>
        <Badge tone="var(--success)" dot>Online</Badge>
      </CardHeader>
      <CardContent>
        <Button onClick={() => console.log("toggled")}>Toggle Light</Button>
      </CardContent>
    </Card>
  );
}
```

Component families: `Accordion` · `Alert` · `AlertDialog` · `AreaPicker` · `AspectRatio` · `Avatar` · `Badge` · `BottomSheet` · `Breadcrumb` · `Button` · `ButtonGroup` · `Calendar` · `Card` · `Carousel` · `Charts (AreaChart, BarList)` · `Checkbox` · `Collapsible` · `ColorSlider` · `ColorWheel` · `Command` · `ContextMenu` · `CopyButton` · `CountPill` · `DataTable` · `Dialog` · `Dock` · `DropdownMenu` · `Empty` · `EntitySelector` · `Field` · `Form` · `HoverCard` · `Input` · `InputGroup` · `InputOTP` · `Item` · `Kbd` · `Label` · `Logo` · `Menubar` · `NavigationMenu` · `NumberField` · `Overlay` · `PageHeader` · `Pagination` · `Popover` · `Progress` · `RadioGroup` · `Resizable` · `ResponsiveDialog` · `SchemaForm` · `ScopeIndicator` · `ScrollArea` · `SectionCard` · `Select` · `Separator` · `SettingsRow` · `Sheet` · `Sidebar` · `Skeleton` · `Slider` · `SlidingIndicator` · `Sonner (toast)` · `Spinner` · `Switch` · `Table` · `Tabs` · `Textarea` · `TierBadge` · `Toggle` · `ToggleGroup` · `Tooltip` · `WidgetCard` · `WidgetIdentity` · `WidgetTrustBadge`

`Badge` is glass-only: `tone` takes any CSS color (`<Badge tone="var(--success)" dot>`); there are no solid variant badges.

### `@glasshome/ui/tokens` — design tokens as data

Framework-free theme model: presets, oklch parsing/derivation, and oklch→hex conversion (gamut-mapped, for renderers that cannot parse oklch). Safe in Node scripts, servers, and build tooling.

```typescript
import { THEME_PRESETS, DEFAULT_THEME_ID, resolveThemeColors, oklchToHex } from "@glasshome/ui/tokens";
```

### `@glasshome/ui/astro/*` — zero-JS server components

Astro components rendering the same surfaces with no client JS:

```astro
---
import Badge from "@glasshome/ui/astro/Badge.astro";
import Button from "@glasshome/ui/astro/Button.astro";
import Card from "@glasshome/ui/astro/Card.astro";
import Alert from "@glasshome/ui/astro/Alert.astro";
---
```

Do not import `@glasshome/ui/solid` in server-run `.astro` files; use these or the root recipes instead.

### `@glasshome/ui/styles` — Tailwind v4 CSS

```css
@import "@glasshome/ui/styles";
```

Provides the glass material, design tokens (colors, radii, animations), and the Tailwind v4 theme layer. `@glasshome/ui/styles/theme` exposes the token palette alone.

## Development

```bash
bun install
bun run dev:gallery   # live component gallery on :5199, hot-reloads against src
bun run test          # vitest unit + render smoke tests
bun run lint          # biome
bun run check:tokens  # theme.css <-> tokens/presets.ts sync guard
bun run check:types   # typecheck src + tests
bun run build         # dist ESM + declarations
bun run check:publish # publint + arethetypeswrong
```

## License

MIT
