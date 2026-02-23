# HexaGrid — Feature Overview

A PWA hexagonal isomorphic keyboard instrument for experimenting with scales, intervals, and note layouts. Works on iPad (touch) and desktop (mouse).

## Core Concept

Every layout is defined by two axis intervals. A hex at axial coordinate `(q, r)` plays:
```
midiNote = rootNote + q * intervalQ + r * intervalR
```
Pointy-top hexagons. Coordinates increase rightward (q) and upward (r), following musical convention.

## Current Features

### Hex Grid (`src/hex/`)
- **Axial coordinate system** with Red Blob Games cube-rounding for pixel-to-hex conversion
- **5 layout presets**: Wicki-Hayden (2,7), Harmonic Table (4,7), Janko (1,2), Chromatic (1,7), Whole Tone (2,4)
- **10 scales**: Chromatic, Major, Natural/Harmonic/Melodic Minor, Pentatonic Major/Minor, Blues, Dorian, Mixolydian
- **Pastel rainbow color mapping** — 12 pitch classes spread evenly across the hue wheel (HSL, 45% saturation, 80% lightness)
- **Scale-aware labels** — in-scale notes get bold text at full opacity; out-of-scale notes get normal weight at 35% opacity
- **Grid extends beyond viewport** — cells generated with padding for future pan/zoom
- Pure TypeScript, zero framework dependencies — 84 unit tests

### Canvas Renderer (`src/renderer/`)
- **Canvas 2D** with devicePixelRatio-aware sizing for crisp Retina rendering
- **Dirty-flag render loop** — only redraws when state changes, via `requestAnimationFrame`
- **Active hex glow** — pressed hexes get saturated fill + colored shadowBlur
- **ResizeObserver** for responsive layout
- Light theme (theming architecture ready for dark mode later)

### Touch/Input System (`src/input/`)
- **PointerEvent-based** multi-touch with `setPointerCapture`
- **Hex hit detection** via `pixelToHex` (cube-coordinate rounding, not DOM elements)
- **Glissando** — drag across hexes triggers sequential notes. Configurable:
  - **Legato**: noteOn new hex → noteOff old hex (overlap by one frame)
  - **Staccato**: noteOff old hex → noteOn new hex (no overlap)
- **Stuck note prevention** (5 layers):
  - Document-level `pointerup`/`pointercancel` safety net
  - `visibilitychange` + `blur` → panic (release all)
  - 10-second max note duration timeout (1s sweep interval)
  - `releaseAll()` on layout/root note change
  - `panic()` method (clears pointers + calls audio engine `releaseAll`)
- **iOS gesture prevention**: `touch-action: none`, `preventDefault` on touchstart/touchmove/touchend, context menu blocked

### Audio Engine (`src/audio/`)
- **Tone.js `PolySynth`** — 12-voice polyphony with built-in voice stealing
- **4 waveforms**: triangle (default), sine, sawtooth, square
- **ADSR envelope**: attack 0.01s, decay 0.1s, sustain 0.7, release 0.3s (all configurable)
- **Fixed velocity**: 0.8 (configurable in code, no touch pressure sensing)
- **iOS AudioContext handling**: `Tone.start()` deferred to first user gesture
- `panic()` → `synth.releaseAll()` for immediate silence

### Settings UI (`src/ui/`)
- **Gear icon** (top-right) toggles settings panel
- **Panel position**: slides from right (landscape) or bottom (portrait) based on `@media (orientation:)`
- **Controls**: layout preset, scale, root note, waveform, glissando mode, ADSR sliders
- **Minimal/brutalist styling** — user will handle detailed design later

### Data Flow
```
PointerEvent → TouchSystem → NoteEvent → AudioEngine (Tone.js) → Speakers
                   ↓
           activeNotes Set → HexRenderer → Canvas
```

### NoteEvent Interface (`src/events/types.ts`)
```typescript
interface NoteEvent {
  type: 'noteOn' | 'noteOff';
  note: number;        // MIDI note 0-127
  velocity: number;    // 0.0-1.0
  timestamp: number;   // performance.now()
}
type NoteEventHandler = (event: NoteEvent) => void;
type NoteEventTransform = (event: NoteEvent, next: NoteEventHandler) => void;
```
The `NoteEventTransform` type is the hook for future arpeggiator/sequencer middleware.

## File Structure
```
src/
  main.ts                          # Svelte mount
  App.svelte                       # Root: wires touch → audio, manages state
  app.css                          # Global reset, touch-action, no-scroll

  hex/                             # Pure TS, zero deps
    types.ts                       # AxialCoord, CubeCoord, HexLayout, GridConfig, HexCell, Point
    coords.ts                      # axialToPixel, pixelToHex, hexRound, hexVertices
    layout.ts                      # coordToMidiNote, midiNoteToName, midiToFrequency
    presets.ts                     # 5 layout presets
    grid.ts                        # generateGrid() — cells for viewport bounds
    scale.ts                       # Scale definitions, isInScale()
    color.ts                       # pitchClassColor/ActiveColor/GlowColor (HSL)
    index.ts                       # barrel export
    __tests__/                     # 84 tests (coords, layout, scale, color, grid)

  renderer/
    HexRenderer.ts                 # Canvas 2D renderer, dirty-flag, DPR
    theme.ts                       # Theme interface, LIGHT_THEME

  input/
    TouchSystem.ts                 # Multi-touch, glissando, stuck-note prevention
    gesturePrevention.ts           # iOS Safari gesture blocking

  audio/
    AudioEngine.ts                 # Tone.js PolySynth wrapper, ADSR, panic

  events/
    types.ts                       # NoteEvent, NoteEventHandler, NoteEventTransform

  ui/
    HexCanvas.svelte               # Canvas + TouchSystem + gesturePrevention binding
    SettingsPanel.svelte            # Layout/scale/waveform/ADSR/glissando controls
```

## Stack
- TypeScript, Svelte 5, Vite 7
- Canvas 2D (renderer), Tone.js (audio)
- Vitest (testing), vite-plugin-pwa (installed, not yet configured)

## Not Yet Implemented
- PWA manifest + service worker (vite-plugin-pwa installed but not wired)
- Pan/zoom (grid extends beyond viewport, but no gesture handling yet)
- Arpeggiator/sequencer (NoteEventTransform type exists as the hook)
- Network MIDI
- Dark theme (theme architecture exists, only light theme defined)
- Effects chain (Tone.js supports it, not wired up)
