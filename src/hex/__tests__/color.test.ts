import { describe, it, expect } from 'vitest';
import { pitchClassColor, pitchClassActiveColor, pitchClassGlowColor } from '../color';

describe('pitchClassColor', () => {
  it('returns valid HSL strings for all 12 pitch classes', () => {
    for (let i = 0; i < 12; i++) {
      const color = pitchClassColor(i);
      expect(color).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);
    }
  });

  it('each pitch class gets a different hue', () => {
    const hues = new Set<string>();
    for (let i = 0; i < 12; i++) {
      hues.add(pitchClassColor(i));
    }
    expect(hues.size).toBe(12);
  });
});

describe('pitchClassActiveColor', () => {
  it('returns valid HSL for active state', () => {
    const color = pitchClassActiveColor(0);
    expect(color).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);
  });
});

describe('pitchClassGlowColor', () => {
  it('returns valid HSLA for glow', () => {
    const color = pitchClassGlowColor(0);
    expect(color).toMatch(/^hsla\(\d+, \d+%, \d+%, [\d.]+\)$/);
  });
});
