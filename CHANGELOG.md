# Changelog

## Unreleased

### Fixed

- Type declarations now resolve under Node 16+ module resolution: all relative imports in emitted `.d.ts` files carry explicit `.js` extensions (previously only bundler resolution worked).
- `tokens/presets.ts` re-synced with `theme.css` after oklch value normalization (`--muted-foreground`).

### Added

- Test suite (vitest + happy-dom + @solidjs/testing-library): unit tests for the BottomSheet state machine, velocity tracker, and drag/scroll arbitration; token model tests (oklch parsing, theme derivation, hex gamut mapping, preset contract); render smoke tests for the core primitives.
- `check:types` (typechecks src + tests) and `check:publish` (publint + arethetypeswrong) scripts; both run in CI and gate npm publishes alongside lint, token sync, and tests.

### Changed

- Node engine requirement raised to `>=20`.
- README rewritten around the actual entry points (`/solid`, `/tokens`, `/astro/*`, `/styles`) and current component inventory.
