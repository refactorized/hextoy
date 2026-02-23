import { describe, it, expect } from 'vitest';
import { isInScale, SCALES } from '../scale';

describe('isInScale', () => {
  describe('chromatic scale includes everything', () => {
    for (let note = 48; note < 72; note++) {
      it(`note ${note} is in chromatic`, () => {
        expect(isInScale(note, 0, SCALES.chromatic)).toBe(true);
      });
    }
  });

  describe('C major scale', () => {
    // C major: C D E F G A B = pitch classes 0,2,4,5,7,9,11
    const inScale = [60, 62, 64, 65, 67, 69, 71]; // C4-B4
    const outOfScale = [61, 63, 66, 68, 70]; // C#, D#, F#, G#, A#

    for (const note of inScale) {
      it(`${note} is in C major`, () => {
        expect(isInScale(note, 0, SCALES.major)).toBe(true);
      });
    }

    for (const note of outOfScale) {
      it(`${note} is NOT in C major`, () => {
        expect(isInScale(note, 0, SCALES.major)).toBe(false);
      });
    }
  });

  describe('transposed scale (D major)', () => {
    // D major: D E F# G A B C# = root pitch class 2
    it('D (62) is in D major', () => {
      expect(isInScale(62, 2, SCALES.major)).toBe(true);
    });

    it('F# (66) is in D major', () => {
      expect(isInScale(66, 2, SCALES.major)).toBe(true);
    });

    it('F (65) is NOT in D major', () => {
      expect(isInScale(65, 2, SCALES.major)).toBe(false);
    });
  });

  describe('pentatonic minor', () => {
    // A minor pentatonic: A C D E G = root 9, intervals 0,3,5,7,10
    it('A is in A minor pentatonic', () => {
      expect(isInScale(69, 9, SCALES.pentatonicMinor)).toBe(true);
    });

    it('C is in A minor pentatonic', () => {
      expect(isInScale(72, 9, SCALES.pentatonicMinor)).toBe(true);
    });

    it('B is NOT in A minor pentatonic', () => {
      expect(isInScale(71, 9, SCALES.pentatonicMinor)).toBe(false);
    });
  });
});
