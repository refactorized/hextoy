/**
 * Pastel rainbow color mapping for 12 pitch classes.
 * Each pitch class gets a distinct hue, with low saturation and high lightness
 * for a faded/pastel look.
 */

/** HSL color string for a pitch class (0-11). */
export function pitchClassColor(pitchClass: number): string {
  // Spread 12 pitch classes evenly across the hue wheel
  // Start at red (0°) for C, go through the rainbow
  const hue = (pitchClass * 30) % 360;
  return `hsl(${hue}, 45%, 80%)`;
}

/** Slightly brighter/more saturated version for active (pressed) hexes. */
export function pitchClassActiveColor(pitchClass: number): string {
  const hue = (pitchClass * 30) % 360;
  return `hsl(${hue}, 65%, 70%)`;
}

/** Glow color for active hex shadow. */
export function pitchClassGlowColor(pitchClass: number): string {
  const hue = (pitchClass * 30) % 360;
  return `hsla(${hue}, 70%, 60%, 0.6)`;
}
