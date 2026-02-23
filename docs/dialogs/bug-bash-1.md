# Bug Bash 1 — Initial Playtest

## Bug List

| # | Status | Summary |
|---|--------|---------|
| 1 | fixed | Stuck notes — notes fail to cancel during mouse drags/clicks |
| 2 | fixed | Touch offset after layout change — notes trigger at wrong position |
| 3 | fixed | Audio clicks and harshness |

---

## Bug 1: Stuck Notes

**Severity**: High — requires page reset to fix
**Repro**: Click/drag with mouse. Sometimes notes continue playing indefinitely.

**Root Cause Analysis**:
PointerEvents can be lost in several ways:
- `pointerup` fires outside the canvas or window
- Browser cancels the pointer without firing `pointercancel`
- `setPointerCapture` fails silently
- Multiple rapid clicks can desync the pointer tracking map

**Proposed Fix**:
- Add a global `pointerup`/`pointercancel` listener on `document` as a safety net
- Implement a maximum note duration timeout (e.g. 10s) — if a note has been on longer than the timeout, auto-release it
- Add a "panic" function that kills all active notes and clears the pointer map
- Consider exposing a panic button in the UI
- On `blur`/`visibilitychange`, release all notes

**Architecture consideration**: Adopting a proper audio library (Tone.js — see notes below) would give us `Synth.releaseAll()` and more robust voice lifecycle management.

**Fix Applied**:
- Document-level `pointerup`/`pointercancel` listeners as safety net for missed events
- `visibilitychange` and `blur` handlers release all notes when tab loses focus
- 10-second max note duration timeout with periodic stale check
- `panic()` method that clears all pointers and calls `Tone.PolySynth.releaseAll()`
- `releaseAll()` called automatically on layout config changes

---

## Bug 2: Touch Offset After Layout Change

**Severity**: High — instrument becomes unplayable until resize
**Repro**: Open settings, change layout (e.g. Wicki-Hayden → Harmonic Table). Touch a hex — the sound doesn't match the hex you touched.

**Root Cause**:
`touchSystem` in HexCanvas.svelte was declared as a plain `let`, not `$state`. The `$effect` responsible for syncing `gridConfig` into the touch system ran before `onMount` (when `touchSystem` was still null), hit the `if (!touchSystem) return` guard, and returned early. Because `touchSystem` wasn't reactive, Svelte never re-ran the effect — it never subscribed to `gridConfig` at all. The renderer's separate `$effect` worked fine because it read `gridConfig` directly without a non-reactive guard blocking subscription. Result: the grid visually updated on layout change, but the touch system kept the old layout config forever.

**Fix Applied**:
- Declared `touchSystem` as `$state(null)`. Now the effect subscribes to `touchSystem` on first run, re-runs when `onMount` sets it (subscribing to `gridConfig`), and re-runs on every layout change.
- `setGridConfig()` calls `releaseAll()` only when layout intervals or rootNote actually change (not on resize)
- Separated `$effect` blocks for origin, gridConfig, and glissandoMode

**Lesson**: In Svelte 5, any `$effect` that guards on a non-reactive variable before reading reactive props will silently never subscribe. Either make the guard `$state`, or read the reactive dependencies before the guard.

---

## Bug 3: Audio Clicks and Harshness

**Severity**: Medium — usable but unpleasant
**Repro**: Play rapidly, especially with short notes or voice stealing.

**Root Cause Analysis**:
Our hand-rolled Web Audio envelope scheduling has several click-prone scenarios:
- Voice stealing: when a voice is stolen, `noteOff` + immediate `noteOn` can create a discontinuity even with the 5ms minimum attack
- `cancelScheduledValues` doesn't capture the current gain — it resets to the last `setValueAtTime`, which may not match the actual instantaneous gain
- `linearRampToValueAtTime` scheduling on an already-ramping gain can cause jumps
- Raw oscillators without any filtering are inherently harsh

**Proposed Fix (short-term)**:
- Use `cancelAndHoldAtTime()` instead of `cancelScheduledValues()` where supported
- Add a small crossfade on voice stealing (5-10ms overlap)
- Add a simple low-pass filter to soften oscillator harmonics

**Proposed Fix (long-term)**:
- **Replace our audio engine with Tone.js** (see architecture note below)

**Fix Applied**:
- Replaced entire hand-rolled audio engine (AudioEngine, Voice, envelope) with Tone.js `PolySynth`
- Deleted `Voice.ts` and `envelope.ts` — Tone handles voice allocation, ADSR, and gain ramping
- `AudioEngine` is now ~80 lines wrapping `Tone.PolySynth` with `triggerAttack`/`triggerRelease`
- Tone's battle-tested envelope scheduling eliminates click artifacts

---

## Architecture Discussion: Audio Library

**Question**: What library should we use so we can focus on note events and let the library handle rendering them?

**Recommendation: Tone.js**

Tone.js is the standard Web Audio framework for musical applications. It would replace our entire `src/audio/` directory and solve bugs #1 and #3 structurally.

**What Tone.js gives us:**
- `Tone.PolySynth` — built-in polyphonic voice management with proper allocation/stealing
- Click-free envelopes — battle-tested ADSR with `cancelAndHoldAtTime`, proper gain ramping
- `synth.triggerAttack(note)` / `synth.triggerRelease(note)` — clean API that maps directly to our NoteEvent
- `synth.releaseAll()` — instant panic/cleanup (solves stuck notes)
- iOS AudioContext handling — `Tone.start()` on first gesture
- Effects chain — reverb, delay, filter, compression ready when we want them
- Transport/scheduling — ready for future arpeggiator/sequencer features
- Actively maintained, huge community

**What we keep:**
- All of `src/hex/` — untouched
- `src/events/types.ts` — NoteEvent interface stays the same
- `src/input/TouchSystem.ts` — still emits NoteEvents
- `src/renderer/` — untouched

**What we replace:**
- `src/audio/AudioEngine.ts` → thin wrapper around `Tone.PolySynth`
- `src/audio/Voice.ts` → deleted (Tone handles voices)
- `src/audio/envelope.ts` → deleted (Tone handles ADSR)

**Migration is minimal** — our `AudioEngine.handleNoteEvent` becomes ~10 lines wrapping Tone.
