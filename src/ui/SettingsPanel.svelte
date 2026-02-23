<script lang="ts">
  import type { HexLayout } from '../hex/types';
  import type { Scale } from '../hex/scale';
  import type { ADSRParams } from '../audio/envelope';
  import type { GlissandoMode } from '../input/TouchSystem';
  import { PRESET_LIST } from '../hex/presets';
  import { SCALE_LIST } from '../hex/scale';

  const WAVEFORMS: OscillatorType[] = ['triangle', 'sine', 'sawtooth', 'square'];
  const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  let {
    open = false,
    layout,
    scale,
    rootNote,
    waveform,
    adsr,
    glissandoMode,
    onLayoutChange,
    onScaleChange,
    onRootNoteChange,
    onWaveformChange,
    onAdsrChange,
    onGlissandoModeChange,
    onClose,
  }: {
    open: boolean;
    layout: HexLayout;
    scale: Scale;
    rootNote: number;
    waveform: OscillatorType;
    adsr: ADSRParams;
    glissandoMode: GlissandoMode;
    onLayoutChange: (layout: HexLayout) => void;
    onScaleChange: (scale: Scale) => void;
    onRootNoteChange: (note: number) => void;
    onWaveformChange: (waveform: OscillatorType) => void;
    onAdsrChange: (adsr: ADSRParams) => void;
    onGlissandoModeChange: (mode: GlissandoMode) => void;
    onClose: () => void;
  } = $props();
</script>

{#if open}
  <div class="settings-overlay" role="presentation" onclick={onClose}></div>
  <div class="settings-panel">
    <div class="settings-header">
      <span>Settings</span>
      <button class="close-btn" onclick={onClose}>x</button>
    </div>

    <div class="settings-body">
      <label>
        Layout
        <select
          value={layout.name}
          onchange={(e) => {
            const selected = PRESET_LIST.find(p => p.name === e.currentTarget.value);
            if (selected) onLayoutChange(selected);
          }}
        >
          {#each PRESET_LIST as preset}
            <option value={preset.name}>{preset.name}</option>
          {/each}
        </select>
      </label>

      <label>
        Scale
        <select
          value={scale.name}
          onchange={(e) => {
            const selected = SCALE_LIST.find(s => s.name === e.currentTarget.value);
            if (selected) onScaleChange(selected);
          }}
        >
          {#each SCALE_LIST as s}
            <option value={s.name}>{s.name}</option>
          {/each}
        </select>
      </label>

      <label>
        Root Note
        <select
          value={rootNote % 12}
          onchange={(e) => {
            const pc = parseInt(e.currentTarget.value);
            const octave = Math.floor(rootNote / 12);
            onRootNoteChange(octave * 12 + pc);
          }}
        >
          {#each NOTE_NAMES as name, i}
            <option value={i}>{name}</option>
          {/each}
        </select>
      </label>

      <label>
        Waveform
        <select
          value={waveform}
          onchange={(e) => onWaveformChange(e.currentTarget.value as OscillatorType)}
        >
          {#each WAVEFORMS as w}
            <option value={w}>{w}</option>
          {/each}
        </select>
      </label>

      <label>
        Glissando
        <select
          value={glissandoMode}
          onchange={(e) => onGlissandoModeChange(e.currentTarget.value as GlissandoMode)}
        >
          <option value="legato">Legato</option>
          <option value="staccato">Staccato</option>
        </select>
      </label>

      <div class="adsr-group">
        <label>
          Attack: {adsr.attack.toFixed(3)}s
          <input type="range" min="0.005" max="2" step="0.005"
            value={adsr.attack}
            oninput={(e) => onAdsrChange({ ...adsr, attack: parseFloat(e.currentTarget.value) })}
          />
        </label>
        <label>
          Decay: {adsr.decay.toFixed(3)}s
          <input type="range" min="0" max="2" step="0.01"
            value={adsr.decay}
            oninput={(e) => onAdsrChange({ ...adsr, decay: parseFloat(e.currentTarget.value) })}
          />
        </label>
        <label>
          Sustain: {adsr.sustain.toFixed(2)}
          <input type="range" min="0" max="1" step="0.01"
            value={adsr.sustain}
            oninput={(e) => onAdsrChange({ ...adsr, sustain: parseFloat(e.currentTarget.value) })}
          />
        </label>
        <label>
          Release: {adsr.release.toFixed(3)}s
          <input type="range" min="0.01" max="5" step="0.01"
            value={adsr.release}
            oninput={(e) => onAdsrChange({ ...adsr, release: parseFloat(e.currentTarget.value) })}
          />
        </label>
      </div>
    </div>
  </div>
{/if}

<style>
  .settings-overlay {
    position: fixed;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: rgba(0,0,0,0.2);
    z-index: 99;
  }
  .settings-panel {
    position: fixed;
    z-index: 100;
    background: #fff;
    border: 1px solid #ccc;
    padding: 12px;
    max-height: 80vh;
    overflow-y: auto;
    font-size: 14px;
  }
  /* Landscape: slide from right */
  @media (orientation: landscape) {
    .settings-panel {
      top: 0; right: 0;
      width: 280px;
      height: 100vh;
      border-left: 2px solid #999;
    }
  }
  /* Portrait: slide from bottom */
  @media (orientation: portrait) {
    .settings-panel {
      bottom: 0; left: 0;
      width: 100%;
      max-height: 50vh;
      border-top: 2px solid #999;
    }
  }
  .settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    font-weight: bold;
  }
  .close-btn {
    background: none;
    border: 1px solid #999;
    font-size: 16px;
    cursor: pointer;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .settings-body {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  select, input[type="range"] {
    width: 100%;
  }
  .adsr-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    border-top: 1px solid #ddd;
    padding-top: 8px;
  }
</style>
