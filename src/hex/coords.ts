import type { AxialCoord, CubeCoord, Point } from './types';

/**
 * Pointy-top hex geometry.
 * q increases to the right, r increases upward (musical convention).
 *
 * We negate y in pixel conversion so that increasing r goes UP on screen
 * (screen y increases downward, but musically we want up = higher pitch).
 */

const SQRT3 = Math.sqrt(3);

/** Convert axial coord to pixel center. Pointy-top, r-up. */
export function axialToPixel(coord: AxialCoord, size: number, origin: Point = { x: 0, y: 0 }): Point {
  const x = size * (SQRT3 * coord.q + (SQRT3 / 2) * coord.r);
  // Negate so r-up maps to screen-up (lower y)
  const y = -(size * (3 / 2) * coord.r);
  return { x: x + origin.x, y: y + origin.y };
}

/** Convert pixel position to fractional axial coord. Pointy-top, r-up. */
export function pixelToAxial(point: Point, size: number, origin: Point = { x: 0, y: 0 }): AxialCoord {
  const px = point.x - origin.x;
  // Negate y back to math space
  const py = -(point.y - origin.y);
  const q = (SQRT3 / 3 * px - 1 / 3 * py) / size;
  const r = (2 / 3 * py) / size;
  return { q, r };
}

/** Round fractional axial to nearest hex (cube-coordinate rounding). */
export function hexRound(frac: AxialCoord): AxialCoord {
  const cube = axialToCube(frac);
  const rounded = cubeRound(cube);
  // Ensure no -0 (use +0)
  return { q: rounded.q || 0, r: rounded.r || 0 };
}

/** Convert fractional pixel point to nearest hex coord. */
export function pixelToHex(point: Point, size: number, origin: Point = { x: 0, y: 0 }): AxialCoord {
  return hexRound(pixelToAxial(point, size, origin));
}

/** Get the 6 vertex positions of a pointy-top hex. */
export function hexVertices(center: Point, size: number): Point[] {
  const vertices: Point[] = [];
  for (let i = 0; i < 6; i++) {
    // Pointy-top: first vertex at 30°
    const angle = (Math.PI / 180) * (60 * i + 30);
    vertices.push({
      x: center.x + size * Math.cos(angle),
      y: center.y + size * Math.sin(angle),
    });
  }
  return vertices;
}

// --- Internal helpers ---

function axialToCube(coord: AxialCoord): CubeCoord {
  return { q: coord.q, r: coord.r, s: -coord.q - coord.r };
}

function cubeRound(cube: CubeCoord): CubeCoord {
  let rq = Math.round(cube.q);
  let rr = Math.round(cube.r);
  let rs = Math.round(cube.s);

  const dq = Math.abs(rq - cube.q);
  const dr = Math.abs(rr - cube.r);
  const ds = Math.abs(rs - cube.s);

  if (dq > dr && dq > ds) {
    rq = -rr - rs;
  } else if (dr > ds) {
    rr = -rq - rs;
  } else {
    rs = -rq - rr;
  }

  return { q: rq, r: rr, s: rs };
}
