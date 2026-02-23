/** Axial hex coordinate (q, r). Pointy-top orientation. */
export interface AxialCoord {
  q: number;
  r: number;
}

/** Cube coordinate for rounding algorithms. */
export interface CubeCoord {
  q: number;
  r: number;
  s: number;
}

/** A hex layout defines the two interval axes. */
export interface HexLayout {
  name: string;
  intervalQ: number; // semitone step along q axis
  intervalR: number; // semitone step along r axis
}

/** Configuration for the entire grid. */
export interface GridConfig {
  layout: HexLayout;
  rootNote: number; // MIDI note at origin (0,0)
  hexSize: number;  // radius in pixels (center to vertex)
}

/** Pixel coordinate. */
export interface Point {
  x: number;
  y: number;
}

/** A single hex cell with its computed data. */
export interface HexCell {
  coord: AxialCoord;
  midiNote: number;
  pitchClass: number; // 0-11
  noteName: string;
  center: Point;      // pixel position
}
