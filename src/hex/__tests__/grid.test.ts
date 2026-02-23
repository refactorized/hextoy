import { describe, it, expect } from 'vitest';
import { generateGrid } from '../grid';
import { PRESETS } from '../presets';

describe('generateGrid', () => {
  const config = {
    layout: PRESETS.wickiHayden,
    rootNote: 60,
    hexSize: 30,
  };

  it('generates cells for a viewport', () => {
    const cells = generateGrid(config, 800, 600, { x: 400, y: 300 });
    expect(cells.length).toBeGreaterThan(0);
  });

  it('origin hex has the root note', () => {
    const origin = { x: 400, y: 300 };
    const cells = generateGrid(config, 800, 600, origin);
    const originCell = cells.find(c => c.coord.q === 0 && c.coord.r === 0);
    expect(originCell).toBeDefined();
    expect(originCell!.midiNote).toBe(60);
    expect(originCell!.noteName).toBe('C4');
  });

  it('all cells have valid pitch classes 0-11', () => {
    const cells = generateGrid(config, 800, 600, { x: 400, y: 300 });
    for (const cell of cells) {
      expect(cell.pitchClass).toBeGreaterThanOrEqual(0);
      expect(cell.pitchClass).toBeLessThanOrEqual(11);
    }
  });

  it('cells have pixel centers within padded viewport', () => {
    const w = 800, h = 600;
    const cells = generateGrid(config, w, h, { x: 400, y: 300 });
    const pad = config.hexSize * 2;
    for (const cell of cells) {
      expect(cell.center.x).toBeGreaterThanOrEqual(-pad);
      expect(cell.center.x).toBeLessThanOrEqual(w + pad);
      expect(cell.center.y).toBeGreaterThanOrEqual(-pad);
      expect(cell.center.y).toBeLessThanOrEqual(h + pad);
    }
  });
});
