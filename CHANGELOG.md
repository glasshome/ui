# Changelog

## [2.0.0](https://github.com/glasshome/ui/compare/v1.0.1...v2.0.0) (2026-07-22)


### ⚠ BREAKING CHANGES

* drop the unused Carousel port

### Code Refactoring

* drop the unused Carousel port ([e273fa7](https://github.com/glasshome/ui/commit/e273fa778435cd271a1b95cc2afbf4869e7b2443))

## 1.0.1 (2026-07-21)

### Fixed

- npm tarball now includes `src/lib/`: the `./astro/*` components import
  shared class recipes from `../lib/*`, which the 1.0.0 package left out
  (fine under a link: symlink, unresolvable from npm).

## 1.0.0 (2026-07-21)

First stable release. The API surface is frozen: removals or reroutes from
here on are semver majors.

### Breaking

- Removed Sidebar, Command, Calendar, Menubar and NavigationMenu (no known
  call sites; re-adding later is a minor).
- Dropped the `@glasshome/sync-layer` peer dependency. EntitySelector and
  AreaPicker read entity/area data through the new `EntityDataAdapter`:
  hosts call `provideEntityData(adapter)` at startup (or wrap a tree in
  `EntityDataContext.Provider`). The `isDemoMode`/`loadDemoData`/
  `unloadDemoData` re-exports are gone.
- Icons are iconify-only: every lucide-solid usage migrated to
  `@iconify-icon/solid` and the lucide-solid dependency is removed. Spinner
  now takes iconify Icon props instead of svg props.
- `tailwindcss` and `tw-animate-css` moved from dependencies to
  peerDependencies (they are build tools, resolved by the consumer's own
  build). `astro` declared as an optional peer for the `./astro/*` entries.
- Removed unused exports: `AlertDialogOverlay`, `AlertDialogPortal`,
  `SECTION_ROW_SURFACE`, bottom-sheet `TRANSITION_CSS`, `SheetState`,
  `SwitchProps`, WidgetCard default export. Legacy top-level `main`/`types`
  package fields removed (the `exports` map is the interface).

### Added

- `EntityDataAdapter` / `EntityDataContext` / `provideEntityData` /
  `useEntityData` plus the structural `EntityViewLike` / `AreaViewLike`
  view types.
- `@source "../../dist"` in the shipped stylesheet, so npm consumers'
  Tailwind builds see component class names without hand-pointed
  node_modules paths.
- Committed `bun.lock`; CI and publishes install with `--frozen-lockfile`.
- Release automation: release-please manages versions and GitHub releases
  from semantic commits; npm publishes use trusted publishing (OIDC).
- Glass frost slot (`--glass-frost`, `--glass-frost-size`,
  `--glass-frost-pos`): hosts can composite a pre-blurred backdrop under
  the glass formula's own material (fixes performant-blur mode losing the
  glass material).

### Fixed

- Type declarations now resolve under Node 16+ module resolution: all relative imports in emitted `.d.ts` files carry explicit `.js` extensions (previously only bundler resolution worked).
- `tokens/presets.ts` re-synced with `theme.css` after oklch value normalization (`--muted-foreground`).

### Added

- Test suite (vitest + happy-dom + @solidjs/testing-library): unit tests for the BottomSheet state machine, velocity tracker, and drag/scroll arbitration; token model tests (oklch parsing, theme derivation, hex gamut mapping, preset contract); render smoke tests for the core primitives.
- `check:types` (typechecks src + tests) and `check:publish` (publint + arethetypeswrong) scripts; both run in CI and gate npm publishes alongside lint, token sync, and tests.

### Changed

- Node engine requirement raised to `>=20`.
- README rewritten around the actual entry points (`/solid`, `/tokens`, `/astro/*`, `/styles`) and current component inventory.
