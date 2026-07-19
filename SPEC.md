# @glasshome/ui — design system contract

Shared by **hub** (Astro + Solid islands) and **dash** (Solid). Read this before
building or styling any UI in either app. `bun run dev:gallery` (in this
package) serves a live gallery of every primitive, hot-reloading against src;
treat it as the executable form of this document.

## The one material

Glass is a single CSS formula: the `.glass` class in `src/styles/globals.css`,
driven by `--glass-*` custom-property knobs. There are no other glass
implementations. Never hand-roll `backdrop-blur` + translucent `bg-*` panels.

```
.glass         neutral pane: card fill, border edge, lit rim, no tint
.glass-tint    + tinted look driven by --glass-tone (badge/alert/button/chip)
.glass-sink    rim flipped concave: the surface reads dug-out (fields)
```

Knobs (typed `@property`, `inherits: false` — a knob set on a parent never
leaks into a nested glass element; set knobs on the element itself):

| Knob | Type | Default | Meaning |
|---|---|---|---|
| `--glass-tone` | color | `transparent` | tint color; every tone term is inert when transparent |
| `--glass-base` | color | `var(--card)` | ground fill; carry alpha for translucency (`color-mix(in srgb, var(--card) 60%, transparent)`) |
| `--glass-edge` | color | border 60% | border color (`.glass-tint` derives it from the tone) |
| `--glass-wash` | % | 28% | tone gradient strength (second stop = wash/3) |
| `--glass-light` | number | 0.05 | top-left white sheen (`.glass-tint` raises to 0.16) |
| `--glass-shade` | number | 0 | bottom-right dark shade (light-theme depth) |
| `--glass-glow` | % | 16% | inner tone glow |
| `--glass-drop` | % | 20% | tone drop shadow |
| `--glass-lift` | number | 0 | elevation shadow (cards 0.45, overlays 0.55) |
| `--glass-rim` | number | 1 | bevel strength 0..1 (cards/overlays 0.3) |
| `--glass-text` | % | 65% | tinted text mix, used by `.glass-tint` only |

The `.glass` formula is deliberately **unlayered**, so it owns
border/background/box-shadow on the element: `bg-*`, `border-*`, and `shadow-*`
utilities on a glass element are no-ops. Tune via knobs instead.

`backdrop-blur` is not part of the formula. Cards add `CARD_BLUR`
(`--glass-blur` px knob); toasts and other transform-animated surfaces must not
blur (Chromium renders black mid-animation).

Mixing rules: tone washes mix in **srgb** (oklch drags a tone mixed toward
transparent down to mud); tinted text mixes in **oklab** (no hue channel, so a
tone desaturates without swinging yellow — `glassToneText()`).

## Surfaces (the only sanctioned recipes)

| Recipe | File | Wear it for |
|---|---|---|
| `CARD_SURFACE` / `CARD_SURFACE_OPAQUE` | lib/card-classes.ts | panels; via `<Card>` |
| `CARD_SURFACE_BASE` + `CARD_BLUR` | lib/card-classes.ts | perf-blur gating (dash SectionCard) |
| `OVERLAY_SURFACE` | lib/overlay-classes.ts | anything floating: menus, dialogs, sheets, tooltips |
| `SCRIM_CLASS` | lib/overlay-classes.ts | modal backdrop (BottomSheet keeps its unblurred scrim for mobile perf) |
| `INPUT_SURFACE` / `INPUT_CLASS` | lib/input-classes.ts | text fields + pickers (concave) |
| `FIELD_CHROME` | lib/input-classes.ts | toggle-family chrome (checkbox box, radio ring, switch track) |
| `TRACK_SURFACE` | lib/card-classes.ts | segmented tracks (tabs, toggle groups) |

## One door per concept

| Need | Use | Never |
|---|---|---|
| a panel | `<Card>` (Solid or `astro/Card.astro`) | `border bg-card/NN backdrop-blur` |
| a floating panel | `<Overlay>` / the overlay-wearing primitive | raw `bg-popover shadow` |
| a modal | `<ResponsiveDialog>` (desktop dialog + mobile bottom sheet), `<Dialog>` for desktop-only | `<Sheet side="bottom">` as a modal |
| a status chip | `<Badge tone="var(--success)">` | `rounded-full bg-green-500/10` |
| a callout | `<Alert tone="warning">` | `border-amber-500/30 bg-amber-500/10` |
| tinted text alone | `glassToneText(tone)` | ad-hoc color-mix |
| a metallic tier chip | `<TierBadge>` | gradients by hand |

In server-run `.astro` frontmatter you cannot import `@glasshome/ui/solid`
(Solid `template()` throws at module load). Use the `@glasshome/ui/astro`
components, or the pure recipes/tokens from the root `@glasshome/ui`.

## Prop language

- `tone` — a CSS **color** string on glass primitives (`Badge`, indicators).
  `Alert.tone` is the one semantic enum (`info|warning|success|destructive`);
  it keys the `ALERT_TONES` table.
- `as` — polymorphic element/component. Never `component`.
- `variant` — cva **style** axis only. Layout choices get their own prop
  (`WidgetCard.layout = "row" | "tile"`).
- Every rendered part carries `data-slot="<component>-<part>"`
  (bottom-sheet's `data-sheet-*` attributes are functional drag hooks, not
  slots).
- All color comes from theme vars (`var(--primary)` etc.). No hex/oklch
  literals in components except neutral black/white shadow alphas.

## Extending the system

Checklist for a new component:

1. Wear an existing surface recipe (or compose `.glass` + knobs). If a new
   surface is genuinely needed, add it as a named recipe in `lib/`, once.
2. Props follow the language above; class merging via `cn(...)`, pass-through
   `class` last.
3. `data-slot` on every rendered part.
4. Astro twin only if server-rendered pages need it; share every class string
   through a pure `lib/` file, never duplicate it.
5. Export via `src/solid/index.ts` (components) and root `src/index.ts` (pure
   recipes needed by SSR).
6. Register a specimen in the gallery (`dev/groups/*` in this package).
7. Comments: only constraints the code cannot express (rendering bugs worked
   around, cascade requirements, a11y invariants). One line each.

Guards: `bun run check:tokens` (theme.css ↔ tokens/presets.ts sync) here;
`bun run ui:check` in the apps (deny-by-default drift scan; escape with a
`ui-drift-ok <reason>` line comment only for genuinely bespoke art).
