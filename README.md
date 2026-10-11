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
        <Badge tone="var(--success)">Online</Badge>
      </CardHeader>
      <CardContent>
        <Button onClick={() => console.log("toggled")}>Toggle Light</Button>
      </CardContent>
    </Card>
  );
}
```

Component families: `Accordion` · `Alert` · `AlertDialog` · `AreaPicker` · `AspectRatio` · `Avatar` · `Badge` · `BottomSheet` · `Breadcrumb` · `Button` · `ButtonGroup` · `Card` · `Carousel` · `Charts (AreaChart, BarList, StackedBar, RangeToggle)` · `Checkbox` · `Collapsible` · `ColorSlider` · `ColorWheel` · `ContextMenu` · `CopyButton` · `CountPill` · `DataTable (TableSearchInput, TableFilterSelect, TableSortHeader, TableSkeleton, TableEmpty, TableError, TableBulkBar)` · `Dialog` · `Dock` · `DropdownMenu` · `Empty` · `EntitySelector` · `Field` · `Form` · `HeroAction` · `HoverCard` · `IconPicker` · `ImagePicker` · `Input` · `InputGroup` · `InputOTP` · `Item` · `Kbd` · `Label` · `Logo` · `MediaTile` · `NumberField` · `OptionCard` · `Overlay` · `PageHeader` · `Pagination` · `PasswordInput` · `PickerSearch` · `Popover` · `Progress` · `RadioGroup` · `Resizable` · `ResponsiveDialog` · `SchemaForm` · `ScopeIndicator` · `ScrollArea` · `SectionCard` · `Select` · `SelectionScope (SelectionHighlight)` · `Separator` · `SettingsRow (SwitchRow, LabeledField, LabeledInput, LabeledIconPicker, RowActions, SectionAddButton, SectionEmpty)` · `Sheet` · `Skeleton` · `Slider` · `SlidingIndicator (deprecated)` · `Sonner (toast)` · `Spinner` · `StepIndicator` · `Switch` · `Table` · `Tabs` · `Textarea` · `TierBadge` · `Toggle` · `ToggleGroup` · `Tooltip` · `WidgetCard` · `WidgetIdentity` · `WidgetTrustBadge`

`Badge` is glass-only: `tone` takes any CSS color (`<Badge tone="var(--success)">`); there are no solid variant badges.

### `@glasshome/ui/tokens` — design tokens as data

Framework-free theme model: presets, oklch parsing/derivation, and oklch→hex conversion (gamut-mapped, for renderers that cannot parse oklch). Safe in Node scripts, servers, and build tooling.

```typescript
import { THEME_PRESETS, DEFAULT_THEME_ID, resolveThemeColors, oklchToHex } from "@glasshome/ui/tokens";
```

### Astro

`.astro` files import `@glasshome/ui/solid` like any Solid file. The package ships its source under the `solid` export condition, so Astro's Solid integration compiles it for the server; a component with no `client:` directive renders to static HTML with no runtime shipped.

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
