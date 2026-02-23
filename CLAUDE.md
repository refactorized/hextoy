# HexaGrid — Claude Code Context

## Project
Hexagonal isomorphic keyboard PWA. TypeScript + Svelte 5 + Canvas 2D + Tone.js.

## Essential Reading
- **`docs/overview.md`** — full feature inventory, file structure, data flow. Keep this up to date when features change.
- **`docs/dialogs/bug-bash-1.md`** — bug tracking with root causes and fixes.

## Commands
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm test` — run vitest (84 tests in src/hex/__tests__/)
- `npm run check` — svelte-check + tsc

## Architecture Rules
- `src/hex/` is pure TypeScript with zero dependencies — no Svelte, no DOM, no Tone.js
- Framework-agnostic core: renderer, touch, and audio have zero Svelte dependency
- All modules communicate via `NoteEvent` interface (src/events/types.ts)
- Audio is Tone.js PolySynth — do not hand-roll Web Audio scheduling
- Svelte 5 runes: any variable used as a guard in `$effect` must be `$state` (see patterns.md in memory)

## Conventions
- Default git branch: `main`
- Pointy-top hexagons, axial coordinates (q right, r up)
- UI: minimal/brutalist for now — user will style later. Less is more.
- Don't prematurely optimize types
