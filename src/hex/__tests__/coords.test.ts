import { describe, it, expect } from 'vitest';
import { axialToPixel, pixelToHex, hexRound, hexVertices, pixelToAxial } from '../coords';

describe('axialToPixel', () => {
  it('maps origin to origin', () => {
    const p = axialToPixel({ q: 0, r: 0 }, 10);
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(0);
  });

  it('q+1 moves right', () => {
    const p = axialToPixel({ q: 1, r: 0 }, 10);
    expect(p.x).toBeGreaterThan(0);
    expect(p.y).toBeCloseTo(0);
  });

  it('r+1 moves up (negative y on screen)', () => {
    const p = axialToPixel({ q: 0, r: 1 }, 10);
    expect(p.y).toBeLessThan(0); // up on screen = negative y
  });

  it('respects origin offset', () => {
    const origin = { x: 100, y: 200 };
    const p = axialToPixel({ q: 0, r: 0 }, 10, origin);
    expect(p.x).toBeCloseTo(100);
    expect(p.y).toBeCloseTo(200);
  });
});

describe('pixelToHex round-trip', () => {
  const coords = [
    { q: 0, r: 0 },
    { q: 1, r: 0 },
    { q: 0, r: 1 },
    { q: -1, r: 1 },
    { q: 3, r: -2 },
    { q: -5, r: 7 },
    { q: 10, r: 10 },
  ];

  for (const coord of coords) {
    it(`round-trips (${coord.q}, ${coord.r})`, () => {
      const size = 20;
      const pixel = axialToPixel(coord, size);
      const result = pixelToHex(pixel, size);
      expect(result.q).toBe(coord.q);
      expect(result.r).toBe(coord.r);
    });
  }

  it('round-trips with a non-zero origin', () => {
    const origin = { x: 500, y: 300 };
    const size = 15;
    const coord = { q: 4, r: -3 };
    const pixel = axialToPixel(coord, size, origin);
    const result = pixelToHex(pixel, size, origin);
    expect(result.q).toBe(coord.q);
    expect(result.r).toBe(coord.r);
  });
});

describe('hexRound', () => {
  it('rounds fractional coords to nearest hex', () => {
    // A point very close to (1, 0) should round there
    const result = hexRound({ q: 0.9, r: 0.1 });
    expect(result.q).toBe(1);
    expect(result.r).toBe(0);
  });

  it('rounds exact integers unchanged', () => {
    const result = hexRound({ q: 3, r: -2 });
    expect(result.q).toBe(3);
    expect(result.r).toBe(-2);
  });
});

describe('hexVertices', () => {
  it('returns 6 vertices', () => {
    const verts = hexVertices({ x: 0, y: 0 }, 10);
    expect(verts).toHaveLength(6);
  });

  it('all vertices are at distance = size from center', () => {
    const center = { x: 50, y: 50 };
    const size = 20;
    const verts = hexVertices(center, size);
    for (const v of verts) {
      const dist = Math.sqrt((v.x - center.x) ** 2 + (v.y - center.y) ** 2);
      expect(dist).toBeCloseTo(size, 5);
    }
  });

  it('pointy-top: first vertex is at 30°', () => {
    const size = 10;
    const verts = hexVertices({ x: 0, y: 0 }, size);
    // At 30°: x = cos(30°)*10 ≈ 8.66, y = sin(30°)*10 = 5
    expect(verts[0].x).toBeCloseTo(size * Math.cos(Math.PI / 6));
    expect(verts[0].y).toBeCloseTo(size * Math.sin(Math.PI / 6));
  });
});
