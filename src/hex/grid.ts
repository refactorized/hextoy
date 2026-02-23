import type { AxialCoord, GridConfig, HexCell, Point } from './types';
import { axialToPixel } from './coords';
import { coordToMidiNote, midiNoteToName, midiNoteToPitchClass } from './layout';

/**
 * Generate all hex cells that are visible within the given pixel bounds.
 * The grid extends beyond the viewport — we generate cells for a generous range.
 */
export function generateGrid(
  config: GridConfig,
  viewWidth: number,
  viewHeight: number,
  origin: Point,
): HexCell[] {
  const { layout, rootNote, hexSize } = config;
  const cells: HexCell[] = [];

  // Calculate how many hexes we need in each direction to fill the view (with padding)
  const SQRT3 = Math.sqrt(3);
  const hexWidth = SQRT3 * hexSize;
  const hexHeight = 2 * hexSize;

  // Generous range: extend well beyond viewport for scrolling/zooming
  const qRange = Math.ceil(viewWidth / hexWidth) + 4;
  const rRange = Math.ceil(viewHeight / (hexHeight * 0.75)) + 4;

  for (let r = -rRange; r <= rRange; r++) {
    for (let q = -qRange; q <= qRange; q++) {
      const coord: AxialCoord = { q, r };
      const center = axialToPixel(coord, hexSize, origin);

      // Only include cells whose centers are within padded viewport
      const pad = hexSize * 2;
      if (
        center.x >= -pad &&
        center.x <= viewWidth + pad &&
        center.y >= -pad &&
        center.y <= viewHeight + pad
      ) {
        const midiNote = coordToMidiNote(coord, layout, rootNote);
        cells.push({
          coord,
          midiNote,
          pitchClass: midiNoteToPitchClass(midiNote),
          noteName: midiNoteToName(midiNote),
          center,
        });
      }
    }
  }

  return cells;
}
