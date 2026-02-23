<script lang="ts">
  import HexCanvas from './ui/HexCanvas.svelte';
  import SettingsPanel from './ui/SettingsPanel.svelte';
  import { DEFAULT_PRESET } from './hex/presets';
  import { DEFAULT_SCALE, type Scale } from './hex/scale';
  import { midiNoteToPitchClass } from './hex/layout';
  import type { GridConfig, HexLayout } from './hex/types';
  import type { NoteEvent } from './events/types';
  import { AudioEngine, DEFAULT_ADSR, type ADSRParams } from './audio/AudioEngine';
  import type { GlissandoMode } from './input/TouchSystem';

  const DEFAULT_ROOT = 60;
  const DEFAULT_HEX_SIZE = 40;

  let gridConfig: GridConfig = $state({
    layout: DEFAULT_PRESET,
    rootNote: DEFAULT_ROOT,
    hexSize: DEFAULT_HEX_SIZE,
  });

  let scale: Scale = $state(DEFAULT_SCALE);
  let rootPitchClass = $state(midiNoteToPitchClass(DEFAULT_ROOT));
  let activeNotes: Set<number> = $state(new Set());
  let waveform: OscillatorType = $state('triangle');
  let adsr: ADSRParams = $state({ ...DEFAULT_ADSR });
  let glissandoMode: GlissandoMode = $state('legato');
  let settingsOpen = $state(false);

  const audioEngine = new AudioEngine();
  let audioInitialized = false;

  async function ensureAudio() {
    if (!audioInitialized) {
      await audioEngine.init();
      audioInitialized = true;
    }
  }

  function handleNoteEvent(event: NoteEvent) {
    ensureAudio();
    audioEngine.handleNoteEvent(event);
  }

  function handleActiveChange(notes: Set<number>) {
    activeNotes = notes;
  }

  function handlePanic() {
    audioEngine.panic();
    activeNotes = new Set();
  }

  function handleLayoutChange(layout: HexLayout) {
    gridConfig = { ...gridConfig, layout };
  }

  function handleScaleChange(s: Scale) {
    scale = s;
  }

  function handleRootNoteChange(note: number) {
    gridConfig = { ...gridConfig, rootNote: note };
    rootPitchClass = midiNoteToPitchClass(note);
  }

  function handleWaveformChange(w: OscillatorType) {
    waveform = w;
    audioEngine.setWaveform(w);
  }

  function handleAdsrChange(a: ADSRParams) {
    adsr = a;
    audioEngine.setADSR(a);
  }

  function handleGlissandoModeChange(mode: GlissandoMode) {
    glissandoMode = mode;
  }
</script>

<main>
  <HexCanvas
    {gridConfig}
    {scale}
    {rootPitchClass}
    {activeNotes}
    {glissandoMode}
    onNoteEvent={handleNoteEvent}
    onActiveChange={handleActiveChange}
    onPanic={handlePanic}
  />

  <button class="gear-btn" onclick={() => settingsOpen = !settingsOpen}>
    {settingsOpen ? 'x' : '\u2699'}
  </button>

  <SettingsPanel
    open={settingsOpen}
    layout={gridConfig.layout}
    {scale}
    rootNote={gridConfig.rootNote}
    {waveform}
    {adsr}
    {glissandoMode}
    onLayoutChange={handleLayoutChange}
    onScaleChange={handleScaleChange}
    onRootNoteChange={handleRootNoteChange}
    onWaveformChange={handleWaveformChange}
    onAdsrChange={handleAdsrChange}
    onGlissandoModeChange={handleGlissandoModeChange}
    onClose={() => settingsOpen = false}
  />
</main>

<style>
  :global(html, body) {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: fixed;
    top: 0;
    left: 0;
  }
  main {
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    position: relative;
  }
  .gear-btn {
    position: fixed;
    top: 12px;
    right: 12px;
    z-index: 101;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 1px solid #999;
    background: rgba(255, 255, 255, 0.85);
    font-size: 22px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
    padding: 0;
  }
</style>
