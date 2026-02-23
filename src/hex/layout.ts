import type { AxialCoord, HexLayout } from './types';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** Compute MIDI note number from axial coord and layout. */
export function coordToMidiNote(coord: AxialCoord, layout: HexLayout, rootNote: number): number {
  return rootNote + coord.q * layout.intervalQ + coord.r * layout.intervalR;
}

/** Get note name from MIDI number (e.g. 60 → "C4"). */
export function midiNoteToName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const pitchClass = ((midi % 12) + 12) % 12; // handle negatives
  return `${NOTE_NAMES[pitchClass]}${octave}`;
}

/** Get pitch class (0-11) from MIDI note. */
export function midiNoteToPitchClass(midi: number): number {
  return ((midi % 12) + 12) % 12;
}

/** Get note name without octave (e.g. "C#"). */
export function pitchClassName(pitchClass: number): string {
  return NOTE_NAMES[((pitchClass % 12) + 12) % 12];
}

/** Convert MIDI note to frequency in Hz (A4 = 440). */
export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}
