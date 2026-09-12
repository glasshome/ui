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
| `--glass-wash` | % | 28% | tone gradient strength (second stop = wash-2) |
| `--glass-tone-2` | color | `var(--glass-tone)` | second tint stop; ordinary property re-declared per `.glass` (no leak), not `@property` |
| `--glass-wash-2` | % | wash/3 | second stop strength; raise to `var(--glass-wash)` for an equal-strength two-tone wash |
| `--glass-wash-angle` | angle | 135deg | tone wash direction; 90deg for horizontal fills (sliders) |

Two-tone surfaces add `.glass-edge-gradient`: border-color cannot gradient, so
the class swaps the border for a masked 1px ring running tone-1→tone-2 at the
`.glass-tint` edge alpha (element must be positioned).
| `--glass-light` | number | 0.05 | top-left white sheen (`.glass-tint` raises to 0.16) |
| `--glass-sheen` | `<x> <y>` | 120% 120% | sheen ellipse size; pin lengths on edge-anchored panels, where a percentage stretches into a blob over a flat field (side sheets use `600px 300px`) |
| `--glass-shade` | number | 0 | bottom-right dark shade (light-theme depth) |
| `--glass-glow` | % | 16% | inner tone glow |
| `--glass-drop` | % | 20% | tone drop shadow |
| `--glass-lift` | number | 0 | elevation shadow (cards 0.45, overlays 0.6) |
| `--glass-rim` | number | 1 | bevel strength 0..1 (cards 0.3, overlays 1) |
| `--glass-text` | % | 65% | tinted text mix, used by `.glass-tint` only |

`.glass` also publishes `--surface-tone`, an ordinary **inheriting** property
mirroring that surface's `--glass-tone`. Descendants that need the accent (an
icon, a label) read `--surface-tone`; reading `--glass-tone` from a child
silently yields `transparent` and paints nothing, because the knobs do not
inherit by design. A nested `.glass` re-declares `--surface-tone` from its own
knob, so the no-leak guarantee still holds.

The `.glass` formula is deliberately **unlayered**, so it owns
border/background/box-shadow on the element: `bg-*`, `border-*`, and `shadow-*`
utilities on a glass element are no-ops. Tune via knobs instead.

`backdrop-blur` is not part of the formula. Cards add `CARD_BLUR` and overlays
`OVERLAY_BLUR` (both read the `--glass-blur` px knob); toasts and other
transform-animated surfaces must not blur (Chromium renders black
mid-animation), and a surface that skips the blur takes an opaque fill
(`CARD_SURFACE_OPAQUE`, `OVERLAY_SURFACE_OPAQUE`) — a translucent fill with
nothing blurred behind it is just see-through.

Mixing rules: tone washes mix in **srgb** (oklch drags a tone mixed toward
transparent down to mud); tinted text mixes in **oklab** (no hue channel, so a
tone desaturates without swinging yellow — `glassToneText()`).

## Surfaces (the only sanctioned recipes)

| Recipe | File | Wear it for |
|---|---|---|
| `CARD_SURFACE` / `CARD_SURFACE_OPAQUE` | lib/card-classes.ts | panels; via `<Card>` |
| `CARD_SURFACE_BASE` + `CARD_BLUR` | lib/card-classes.ts | perf-blur gating (dash SectionCard) |
| `OVERLAY_SURFACE` | lib/overlay-classes.ts | anything floating: menus, dialogs, sheets, tooltips |
| `OVERLAY_SURFACE_BASE` + `OVERLAY_BLUR` | lib/overlay-classes.ts | perf-blur gating, same split as the card recipe |
| `OVERLAY_SURFACE_OPAQUE` | lib/overlay-classes.ts | drag-animated overlays that cannot blur (BottomSheet) |
| `SCRIM_CLASS` | lib/overlay-classes.ts | modal backdrop (BottomSheet keeps its unblurred scrim for mobile perf) |
| `INPUT_SURFACE` / `INPUT_CLASS` | lib/input-classes.ts | text fields + pickers (concave) |
| `FIELD_CHROME` | lib/input-classes.ts | toggle chrome and rails (checkbox box, radio ring, switch track, slider rail, chart wells) |
| `TRACK_SURFACE` | lib/card-classes.ts | segmented tracks (tabs, toggle groups) |

**Fields are not symmetric across the themes.** The recess is `.glass-sink`'s
rim, which is theme independent; the fill under it is not. On the dark ground a
field sits a touch ABOVE its card (card 0.17, `--input` 0.19) and reads as
dug-out. Applying the same idea downward in the light theme puts a 0.9 fill
under a 0.995 card — a nine-point drop, which is the cue this library (and every
browser) spends on `disabled`, so a form of nine fields reads switched off. So
`INPUT_SURFACE` takes its knobs from a theme-owned pair, `--field` /
`--field-edge`: light fields sit AT the card with a solid `--border` edge (the
boundary still measures 1.33:1 against the card, exactly what the fill drop used
to carry), dark fields keep `--input` and the formula's soft 60% edge. Controls
that must read as an *empty well* rather than a fillable field — the toggle
chrome and rails — stay on `--input` in both themes via `FIELD_CHROME`.

Semantic roles (`--success`, `--warning`, `--destructive`, `--ring`) are one
value each, worn as fill and as text, so each theme tunes its own: the light
values are darker than their dark-theme counterparts, not the same color. Every
role clears 4.5:1 against `--background`/`--card`/`--popover`/`--muted` (3:1 for
`--ring`, a focus indicator), enforced by `tests/tokens/contrast.test.ts`.

## One door per concept

| Need | Use | Never |
|---|---|---|
| a panel | `<Card>` | `border bg-card/NN backdrop-blur` |
| a floating panel | `<Overlay>` / the overlay-wearing primitive | raw `bg-popover shadow` |
| a modal | `<ResponsiveDialog>` (desktop dialog + mobile bottom sheet), `<Dialog>` for desktop-only | `<Sheet side="bottom">` as a modal |
| an avatar or icon beside a modal title | `<Header media={…}>` | a hand-rolled row inside the header |
| a tab row in a modal header | `<Tabs layout="split">` around the parts, `<Header wrap action={<TabsList class="w-auto">…}>` | `class="contents"` on `Tabs` and `flex-wrap` by hand |
| a form inside a modal | `<Body as="form" id="…">` + a footer button with `form="…"` | a `display: contents` form wrapper inside the Body |
| a glyph | `<Icon icon="lucide:plus" width={16}>` (inline svg from the host's `provideIcons` source) | `<iconify-icon>`, `@iconify-icon/solid` |
| a status chip | `<Badge tone="var(--success)">` | `rounded-full bg-green-500/10` |
| a callout | `<Alert tone="warning">` | `border-amber-500/30 bg-amber-500/10` |
| a labelled group inside a card | `<SectionGroup icon label count action>` | a hand-rolled `SectionIcon` + `SectionSubtitle` header row |
| a titled group of form rows | `<FieldSet>` + `<FieldLegend>` (+ `<FieldDescription>`) | a tracked uppercase `SectionLabel` eyebrow |
| rows that belong to the row above them | `<FieldSubGroup>` | a bare `<Separator>` and a left pad |
| picking one of a few described choices | `<OptionCardGroup>` + `<OptionCard>` | a hand-rolled `role="radio"` card list |
| picking one area, or several | `<AreaPicker>` (`values` + `onValuesChange` for multi) | a hand-rolled checkbox list of areas |
| position inside a multi-step flow | `<StepIndicator count index>` | a hand-rolled row of dots |
| tinted text alone | `glassToneText(tone)` | ad-hoc color-mix |
| a metallic tier chip | `<TierBadge>` | gradients by hand |

Server-run `.astro` markup imports `@glasshome/ui/solid` too: the `solid`
export condition hands Astro the source, and a component with no `client:`
directive renders to static HTML with no runtime shipped.

## Motion (the pillar)

Motion is one system, not per-component flair. Four rules, all held by
`lib/motion-classes.ts`, `.gh-stagger` and the `--glass-*` transition in
`globals.css`, on the theme tokens `--duration-*` / `--ease-*` (zeroed under
`prefers-reduced-motion`):

1. **Colours never snap.** A tinted state change (checked, selected, hover, tone
   swap) morphs on `--duration-state`. Every glass surface gets this from the
   base rule; a surface that names its own transition says `transition-glass`,
   never `transition-all` (Chromium's `all` skips registered custom properties).
2. **Shapes morph, they do not appear.** A thing that opens grows out of what
   opened it: a picker or menu panel unrolls out of its trigger's box
   (`MORPH_MOTION`, `FIELD_MOTION`), a dialog rises into place (`MODAL_MOTION`),
   a card with sub-options grows to reveal them (OptionCard's drawer), an
   indicator slides and stretches (SlidingIndicator, position bars). Nothing is
   swapped in below or beside its origin.
3. **Children arrive one after another.** The rows behind a growing edge stagger
   in (`STAGGER` = `.gh-stagger`, base 80ms, 60ms per row, capped), so a panel is
   read top to bottom as it opens. Mount-only: live re-renders never re-stagger.
4. **Leaving is the same path, faster.** Contract on `--ease-contract` at half
   the arrival time. Pressables dip (`PRESS_DIP`).
5. **Ambient motion is an event.** A wallpaper or decorative loop runs for a
   window after mount or a touch, then freezes mid-phase; an idle screen
   animates nothing. The host holds `html[data-motion="live"]` for the window
   (dash: `createMotionWindow`, 30 s); light-DOM loops gate on that attribute,
   widget shadow roots on the inherited `--motion-ambient` (1 live, else 0)
   or, for a loop that can only pause, `--motion-play` (`running` live, else
   `paused`). A wrapper with `data-motion="still"` opts out: thumbnails are
   stills. A mode indicator is not decoration: it may loop for as long
   as its mode is on, provided the mode itself is bounded (dash leaves edit mode
   after three idle minutes). `.glass-edge-orbit` is that rim.

`HOLD_MOTION`: hold progress. A fill grows out of the touch while held, dissolves once the hold fires, and drains back faster if let go early (holding the dock to change modes).

`RISE_MOTION`: `MODAL_MOTION`'s twin for a surface that stays mounted; its closed state is a resting style, since a mount door's exit ends and leaves the element showing.

A new component with an open, pick or reveal state uses these doors before it
gets any motion of its own; a motion need none of them covers is added to
`motion-classes.ts`, not written inline.

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
- Text chrome (`Badge`, `CountPill`, `SectionMeta`, `SectionCard.subtitleClass`)
  merges the caller's classes through `cn`, so `class="text-sm"` is the
  sanctioned size door for a desk-distance surface. The default register stays
  `text-xs`; no component grows a `size` prop for this.

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
`bun gov check --only ui-drift` in dash (deny-by-default drift scan for every app; escape with a
`ui-drift-ok <reason>` line comment only for genuinely bespoke art).
