import * as Tone from 'tone';
import type { NoteEvent, NoteEventHandler } from '../events/types';
import { midiToFrequency } from '../hex/layout';

export interface ADSRParams {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

export const DEFAULT_ADSR: ADSRParams = {
  attack: 0.01,
  decay: 0.1,
  sustain: 0.7,
  release: 0.3,
};

export class AudioEngine {
  private synth: Tone.PolySynth | null = null;
  private initialized = false;
  private waveform: OscillatorType = 'triangle';
  private adsr: ADSRParams = { ...DEFAULT_ADSR };

  async init(): Promise<void> {
    if (this.initialized) return;
    await Tone.start();
    this.synth = new Tone.PolySynth(Tone.Synth, {
      maxPolyphony: 12,
      voice: Tone.Synth,
      options: {
        oscillator: { type: this.waveform },
        envelope: {
          attack: this.adsr.attack,
          decay: this.adsr.decay,
          sustain: this.adsr.sustain,
          release: this.adsr.release,
        },
      },
    }).toDestination();
    this.initialized = true;
  }

  handleNoteEvent: NoteEventHandler = (event: NoteEvent): void => {
    if (!this.synth) return;
    const freq = midiToFrequency(event.note);
    if (event.type === 'noteOn') {
      this.synth.triggerAttack(freq, Tone.now(), event.velocity);
    } else {
      this.synth.triggerRelease(freq, Tone.now());
    }
  };

  setWaveform(waveform: OscillatorType): void {
    this.waveform = waveform;
    if (this.synth) {
      this.synth.set({ oscillator: { type: waveform } });
    }
  }

  setADSR(adsr: ADSRParams): void {
    this.adsr = adsr;
    if (this.synth) {
      this.synth.set({
        envelope: {
          attack: adsr.attack,
          decay: adsr.decay,
          sustain: adsr.sustain,
          release: adsr.release,
        },
      });
    }
  }

  /** Release all playing notes immediately. */
  panic(): void {
    if (this.synth) {
      this.synth.releaseAll(Tone.now());
    }
  }
}
