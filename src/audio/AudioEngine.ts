import type { NoteEvent, NoteEventHandler } from '../events/types';
import { Voice } from './Voice';
import { type ADSRParams, DEFAULT_ADSR } from './envelope';

const VOICE_COUNT = 12;

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private voices: Voice[] = [];
  private noteToVoice: Map<number, Voice> = new Map();
  private adsr: ADSRParams = DEFAULT_ADSR;
  private waveform: OscillatorType = 'triangle';

  /** Initialize AudioContext. Must be called from a user gesture. */
  async init(): Promise<void> {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      return;
    }

    this.ctx = new AudioContext();

    // Create voice pool
    for (let i = 0; i < VOICE_COUNT; i++) {
      const voice = new Voice(this.ctx, this.ctx.destination);
      voice.setADSR(this.adsr);
      voice.setWaveform(this.waveform);
      this.voices.push(voice);
    }
  }

  /** Handle a NoteEvent. Can be used as NoteEventHandler directly. */
  handleNoteEvent: NoteEventHandler = (event: NoteEvent): void => {
    if (!this.ctx) return;

    const time = this.ctx.currentTime;

    if (event.type === 'noteOn') {
      this.noteOn(event.note, event.velocity, time);
    } else {
      this.noteOff(event.note, time);
    }
  };

  setADSR(adsr: ADSRParams): void {
    this.adsr = adsr;
    for (const voice of this.voices) {
      voice.setADSR(adsr);
    }
  }

  setWaveform(waveform: OscillatorType): void {
    this.waveform = waveform;
    for (const voice of this.voices) {
      voice.setWaveform(waveform);
    }
  }

  private noteOn(note: number, velocity: number, time: number): void {
    // If this note is already playing, reuse its voice
    let voice = this.noteToVoice.get(note);

    if (!voice) {
      voice = this.allocateVoice(time);
      if (!voice) return; // Should never happen with stealing
    }

    // Remove old note mapping if this voice was playing a different note
    if (voice.note !== note && voice.note >= 0) {
      this.noteToVoice.delete(voice.note);
    }

    this.noteToVoice.set(note, voice);
    voice.noteOn(note, velocity, time);
  }

  private noteOff(note: number, time: number): void {
    const voice = this.noteToVoice.get(note);
    if (!voice) return;

    voice.noteOff(time);
    this.noteToVoice.delete(note);
  }

  /** Allocate a voice, stealing the oldest active one if necessary. */
  private allocateVoice(time: number): Voice {
    // First: find an inactive voice
    for (const voice of this.voices) {
      if (!voice.active) return voice;
    }

    // All voices active: steal the oldest (earliest startTime)
    let oldest = this.voices[0];
    for (const voice of this.voices) {
      if (voice.startTime < oldest.startTime) {
        oldest = voice;
      }
    }

    // Release the stolen voice immediately
    oldest.noteOff(time);
    this.noteToVoice.delete(oldest.note);

    return oldest;
  }
}
