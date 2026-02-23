import { describe, it, expect } from 'vitest';
import { coordToMidiNote, midiNoteToName, midiNoteToPitchClass, midiToFrequency } from '../layout';
import { PRESETS } from '../presets';

describe('coordToMidiNote', () => {
  it('origin returns root note', () => {
    expect(coordToMidiNote({ q: 0, r: 0 }, PRESETS.wickiHayden, 60)).toBe(60);
  });

  it('Wicki-Hayden: q+1 = +2 semitones', () => {
    expect(coordToMidiNote({ q: 1, r: 0 }, PRESETS.wickiHayden, 60)).toBe(62);
  });

  it('Wicki-Hayden: r+1 = +7 semitones (perfect fifth)', () => {
    expect(coordToMidiNote({ q: 0, r: 1 }, PRESETS.wickiHayden, 60)).toBe(67);
  });

  it('Harmonic Table: q+1 = +4, r+1 = +7', () => {
    expect(coordToMidiNote({ q: 1, r: 0 }, PRESETS.harmonicTable, 60)).toBe(64);
    expect(coordToMidiNote({ q: 0, r: 1 }, PRESETS.harmonicTable, 60)).toBe(67);
  });

  it('Janko: q+1 = +1, r+1 = +2', () => {
    expect(coordToMidiNote({ q: 1, r: 0 }, PRESETS.janko, 60)).toBe(61);
    expect(coordToMidiNote({ q: 0, r: 1 }, PRESETS.janko, 60)).toBe(62);
  });

  it('Chromatic: q+1 = +1, r+1 = +7', () => {
    expect(coordToMidiNote({ q: 1, r: 0 }, PRESETS.chromatic, 60)).toBe(61);
    expect(coordToMidiNote({ q: 0, r: 1 }, PRESETS.chromatic, 60)).toBe(67);
  });

  it('Whole Tone: q+1 = +2, r+1 = +4', () => {
    expect(coordToMidiNote({ q: 1, r: 0 }, PRESETS.wholeTone, 60)).toBe(62);
    expect(coordToMidiNote({ q: 0, r: 1 }, PRESETS.wholeTone, 60)).toBe(64);
  });

  it('handles negative coordinates', () => {
    expect(coordToMidiNote({ q: -1, r: -1 }, PRESETS.wickiHayden, 60)).toBe(60 - 2 - 7);
  });
});

describe('midiNoteToName', () => {
  it('middle C is C4', () => {
    expect(midiNoteToName(60)).toBe('C4');
  });

  it('A4 is 69', () => {
    expect(midiNoteToName(69)).toBe('A4');
  });

  it('handles sharps', () => {
    expect(midiNoteToName(61)).toBe('C#4');
  });

  it('handles low notes', () => {
    expect(midiNoteToName(0)).toBe('C-1');
  });
});

describe('midiNoteToPitchClass', () => {
  it('C is 0', () => {
    expect(midiNoteToPitchClass(60)).toBe(0);
    expect(midiNoteToPitchClass(72)).toBe(0);
  });

  it('wraps correctly', () => {
    expect(midiNoteToPitchClass(61)).toBe(1); // C#
    expect(midiNoteToPitchClass(69)).toBe(9); // A
  });
});

describe('midiToFrequency', () => {
  it('A4 = 440 Hz', () => {
    expect(midiToFrequency(69)).toBeCloseTo(440);
  });

  it('A3 = 220 Hz', () => {
    expect(midiToFrequency(57)).toBeCloseTo(220);
  });

  it('C4 ≈ 261.63 Hz', () => {
    expect(midiToFrequency(60)).toBeCloseTo(261.63, 1);
  });
});
