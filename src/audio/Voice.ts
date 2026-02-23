import { midiToFrequency } from '../hex/layout';
import { scheduleAttack, scheduleRelease, type ADSRParams, DEFAULT_ADSR } from './envelope';

export class Voice {
  private ctx: AudioContext;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode;
  private _note: number = -1;
  private _active: boolean = false;
  private _startTime: number = 0;
  private releaseEndTime: number = 0;
  private adsr: ADSRParams = DEFAULT_ADSR;
  private _waveform: OscillatorType = 'triangle';

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    this.gainNode = ctx.createGain();
    this.gainNode.gain.setValueAtTime(0, ctx.currentTime);
    this.gainNode.connect(destination);
  }

  get note(): number { return this._note; }
  get active(): boolean { return this._active; }
  get startTime(): number { return this._startTime; }

  setADSR(adsr: ADSRParams): void {
    this.adsr = adsr;
  }

  setWaveform(waveform: OscillatorType): void {
    this._waveform = waveform;
    if (this.oscillator && this._active) {
      this.oscillator.type = waveform;
    }
  }

  noteOn(note: number, velocity: number, time: number): void {
    // Stop previous oscillator if any
    this.stopOscillator(time);

    this._note = note;
    this._active = true;
    this._startTime = time;

    // Create new oscillator
    this.oscillator = this.ctx.createOscillator();
    this.oscillator.type = this._waveform;
    this.oscillator.frequency.setValueAtTime(midiToFrequency(note), time);
    this.oscillator.connect(this.gainNode);
    this.oscillator.start(time);

    scheduleAttack(this.gainNode, this.adsr, velocity, time);
  }

  noteOff(time: number): void {
    if (!this._active) return;
    this._active = false;

    this.releaseEndTime = scheduleRelease(this.gainNode, this.adsr, time);

    // Stop oscillator after release completes
    if (this.oscillator) {
      const osc = this.oscillator;
      osc.stop(this.releaseEndTime);
      this.oscillator = null;
    }
  }

  private stopOscillator(time: number): void {
    if (this.oscillator) {
      try {
        this.oscillator.stop(time);
      } catch {
        // Already stopped
      }
      this.oscillator = null;
    }
  }
}
