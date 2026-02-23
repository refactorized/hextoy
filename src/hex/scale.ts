/** Scale defined as a set of semitone intervals from the root. */
export interface Scale {
  name: string;
  intervals: number[]; // semitones from root included in scale
}

export const SCALES: Record<string, Scale> = {
  chromatic: {
    name: 'Chromatic',
    intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  },
  major: {
    name: 'Major',
    intervals: [0, 2, 4, 5, 7, 9, 11],
  },
  minor: {
    name: 'Natural Minor',
    intervals: [0, 2, 3, 5, 7, 8, 10],
  },
  harmonicMinor: {
    name: 'Harmonic Minor',
    intervals: [0, 2, 3, 5, 7, 8, 11],
  },
  melodicMinor: {
    name: 'Melodic Minor',
    intervals: [0, 2, 3, 5, 7, 9, 11],
  },
  pentatonicMajor: {
    name: 'Pentatonic Major',
    intervals: [0, 2, 4, 7, 9],
  },
  pentatonicMinor: {
    name: 'Pentatonic Minor',
    intervals: [0, 3, 5, 7, 10],
  },
  blues: {
    name: 'Blues',
    intervals: [0, 3, 5, 6, 7, 10],
  },
  dorian: {
    name: 'Dorian',
    intervals: [0, 2, 3, 5, 7, 9, 10],
  },
  mixolydian: {
    name: 'Mixolydian',
    intervals: [0, 2, 4, 5, 7, 9, 10],
  },
};

export const SCALE_LIST: Scale[] = Object.values(SCALES);
export const DEFAULT_SCALE = SCALES.chromatic;

/** Check if a MIDI note is in the given scale with the given root pitch class (0-11). */
export function isInScale(midiNote: number, rootPitchClass: number, scale: Scale): boolean {
  const pitchClass = ((midiNote - rootPitchClass) % 12 + 12) % 12;
  return scale.intervals.includes(pitchClass);
}
