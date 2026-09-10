# The gallery: design spec

Three areas: Foundations, Components, Screens. Rev 2, 2026-09-08.

The gallery is the executable form of `SPEC.md`. It renders components today.
This adds the theme below them and whole screens above them.

Two readers. A human checking a change in pixels at more than one width. An
agent resolving a surface to an export, which reads the files, never the browser.

## Decisions

| Question | Decision |
|---|---|
| Areas | Foundations, Components, Screens |
| Composition layer | Screens, built from named exported sub-blocks |
| Agent door | Screen files, plus `SPEC.md`'s one-door table (already on npm) |
| Navigation | `<Dock>` for the three areas. Labelled list inside one. Components is one page |
| Screens | settings, dashboard, wizard, entity modal + list states |
| Theme axis | In page |
| Width axis | An iframe at a real viewport size |
| Motion axis | `shoot.mjs --reduced-motion`, no in-page control |
| Freshness | `check:gallery` in this package's CI, plus page-error-free shots |
| Out | Recipes area, gaps board, props tables, do-and-don't pairs |
| Later specs | Skill distribution, hosted build |

## Step zero

The gallery is in no tsconfig (`tsconfig.json` includes `src/**/*`,
`tsconfig.test.json` adds `tests`), so `check:types` has never seen it.

1. Add `dev/**/*` to `tsconfig.test.json`. Add `vite/client` to `types`.
2. Fix the 12 errors that surfaces. Two are real: `OverlaysCatalog.tsx:205` and
   `:361` pass `variant` to a `<Button as={…}>` that does not take it. The rest
   are `noUncheckedIndexedAccess` in `GlassPlayground.tsx` and `PickersCatalog.tsx`.
3. Call `provideIcons` in `main.tsx` with a bundled lucide subset. Only
   `tests/setup.ts` does today, so every `<Icon>` in the gallery renders the
   empty placeholder.
4. `GlassCatalog.tsx:25`'s `KNOBS` list is 5 of SPEC's 14 knobs, kept by hand,
   and has drifted (`--glass-wash` 20% against SPEC's 28%, `--glass-lift` 0.45
   against 0). It moves to Foundations, derived.

## Foundations

Colour roles with measured contrast, radius ladder, elevation, `--duration-*` /
`--ease-*` pairs, the 14 glass knobs, and the surface recipes worn as surfaces
(`CARD_SURFACE`, `OVERLAY_SURFACE`, `INPUT_SURFACE`, `FIELD_CHROME`,
`TRACK_SURFACE`, `SCRIM_CLASS`). `GlassPlayground` moves here.

Sourcing:

- `presets.ts` holds 12 roles and none of `--success`, `--warning`, `--love`,
  `--foreground`, `--scrim`, `--chart-*`. So Foundations parses `theme.css`.
- Two parsers for that file already exist, in `scripts/check-tokens.ts` and
  `tests/tokens/contrast.test.ts`. Export one from `src/tokens/`; all three use it.
- Export the contrast helper from `src/tokens/` too. It lives in the test file.
- No type scale. `theme.css` declares no `--text-*` or `--leading-*`; the scale
  is Tailwind's default.

## Components

The eleven groups, one page, one grammar. The dock scrolls to anchors; the
headings already carry `id` and `scroll-mt-24`.

```tsx
<Specimen name="Button">
  <Axis of="variant">…</Axis>
  <Axis of="size">…</Axis>
</Specimen>

<Specimen name="ContextMenu" try="right-click">…</Specimen>
```

- `of` is the component's real prop name. A closed union
  (`variant|size|state|tone|layout|parts`) does not fit: `ColorSlider.channel`,
  `Carousel.transition`, `SchemaForm.formType`, `EntitySelector.domain` and
  orientation pairs fall outside it, and `SPEC.md` reserves `variant` for the
  cva style axis.
- `try` is the interaction. 18 hints are this today, and `shoot.mjs:113,122`
  reads them as `--click` / `--hover` trigger text.
- Live state renders as a value chip in the cell header.
- Uniform cell height per row. `span` for tables, calendars, colour wheels.
- Specimen names are export names. Ten are not today (`Sonner`, `Thumbs`,
  `DataTable empty`, `Tune the material`, and others). Renaming changes
  `data-specimen` keys and existing shot filenames.
- Order stays authored. `DataTable empty` and `DataTable skeleton` belong
  adjacent.
- `CatalogNote` deletion is a move, not a drop. About 20 of the 47 caption texts
  are invariants held nowhere else ("wipe stacks its slides in one grid cell, so
  wipe cannot be dragged", "the card owns the padding", "counts over 9 read as
  9+"). They go to `SPEC.md` or the component's own file, same commit, one home.

## Screens

`dev/screens/`, built from `../src/solid` and `dev/fixtures.ts`:

- `settings-shape.tsx` — sections, rows, fieldsets, switches, selects, a
  destructive zone
- `dashboard-shape.tsx` — wallpaper ground, widget grid, floating dock
- `wizard-shape.tsx` — step indicator, option cards, header and footer actions
- `entity-modal-shape.tsx` — responsive dialog with header media and a body
  form, plus the list triad (loaded, `Empty`, `Skeleton`, `SectionRowSkeletons`)

Each screen exports named sub-blocks, one per composition worth copying:
`FieldGroup`, `DangerZone`, `ModalForm`, `ChoiceStep`, `ListTriad`.

A screen documents the package. It will drift from dash's real settings page,
so it is named for the shape, and the skill says a screen is not dash's spec.

## Shell

```
dev/
  main.tsx           hash route, dock, theme, provideIcons
  routes.ts          area -> entries { id, title, component }
  fixtures.ts        an EntityDataAdapter, a media store, demo data
  CatalogKit.tsx     Specimen + Axis
  foundations/*.tsx
  groups/*.tsx
  screens/*.tsx
  shoot.mjs
```

Hash routing is a signal, about fifteen lines. No `@solidjs/router` dependency.

`<Dock>` carries the three areas. Entries inside an area are a labelled list:
`Dock` hides its tooltip labels below `sm` (`dock.tsx:92`) and scrolls
horizontally when crowded, and the full set is 34 destinations.

Width renders the route in an `<iframe>` at a real viewport size.
`use-is-mobile.ts` reads `window.innerWidth` (used by `responsive-dialog.tsx`,
`entity-selector.tsx`, `sonner.tsx`), `src/` carries 48 `sm:` media queries, and
`MODAL_PANEL` is `fixed left-1/2` portalled to `document.body`.

Motion has no in-page control. `prefers-reduced-motion` is a bare media query in
`theme.css` and `globals.css` with no class hook.

## Fixtures

`dev/fixtures.ts` exports an adapter and a store, not consts. `EntityDataAdapter`
(`src/solid/entity-data.ts:41-50`) needs `entityIdsByDomain`, `useEntities(ids)`,
`getEntityView(id)`, `useAreas()`, and `useEntityData()` throws without a
provider (`entity-data.ts:71`). `PickersCatalog.tsx:140` already provides this;
it moves to `fixtures.ts`.

A block needing host context renders its own provider inside its own file.

## Gate

`scripts/check-gallery.ts`, script `check:gallery`, in this package's CI. Dash's
gate registry does not reach into a submodule.

1. Every component-valued export from `src/solid/index.ts` has a `<Specimen>`.
   Type-only exports and `SCREAMING_CASE` class strings are excluded by rule.
   A part also counts as covered when it renders as a JSX tag inside the
   specimen of another export declared in the same source file
   (`DialogTitle` inside `Dialog`'s cell). Rendering from a different file does
   not count, and neither does a part no specimen renders. Without this rule 188
   of 282 component exports report; with it, 30 did on day one.
2. Every `<Specimen name>` is an export name.

`src/index.ts` (surface and motion recipes) is covered by Foundations rendering
them.

`dev/coverage-allow.ts` holds the residue as `[name, reason]` pairs, reason
mandatory and non-empty.

## Verification

`shoot.mjs` collects `pageerror` and `console.error` in Chromium and exits
non-zero on any (`:90-92,136-139`). CI runs it across the route list.

Changes:

- `--stage phone|tablet|desktop`. `--width` is already a numeric viewport
  (`:33`), so `--width phone` yields `viewport: { width: NaN }`.
- `--route <hash>`, with its own full-page path and a settle condition. The
  existing loop shoots `[data-specimen]` cells and exits 0 having written
  nothing on a screen route.
- `--reduced-motion`, via `page.emulateMedia`.
- `#/all` mounts every group, so the shoot-everything default survives.
- Shooting `data-specimen` by name is unchanged.

No happy-dom mount suite. Every `getBoundingClientRect()` is zero there, so
`SlidingIndicator.measure()` nulls out, `ResizeObserver` never fires, and every
`<Icon>` is the placeholder.
