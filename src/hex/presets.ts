import type { HexLayout } from './types';

export const PRESETS: Record<string, HexLayout> = {
  wickiHayden: {
    name: 'Wicki-Hayden',
    intervalQ: 2,
    intervalR: 7,
  },
  harmonicTable: {
    name: 'Harmonic Table',
    intervalQ: 4,
    intervalR: 7,
  },
  janko: {
    name: 'Janko',
    intervalQ: 1,
    intervalR: 2,
  },
  chromatic: {
    name: 'Chromatic',
    intervalQ: 1,
    intervalR: 7,
  },
  wholeTone: {
    name: 'Whole Tone',
    intervalQ: 2,
    intervalR: 4,
  },
};

export const PRESET_LIST: HexLayout[] = Object.values(PRESETS);
export const DEFAULT_PRESET = PRESETS.wickiHayden;
