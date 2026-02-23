export interface Theme {
  background: string;
  hexStroke: string;
  hexStrokeWidth: number;
  labelColor: string;
  labelScaleFont: string;      // font for in-scale notes
  labelNonScaleFont: string;   // font for out-of-scale notes
  labelScaleAlpha: number;
  labelNonScaleAlpha: number;
  activeGlowRadius: number;
  activeGlowSpread: number;
}

export const LIGHT_THEME: Theme = {
  background: '#f5f5f5',
  hexStroke: '#ccc',
  hexStrokeWidth: 1,
  labelColor: '#333',
  labelScaleFont: 'bold',
  labelNonScaleFont: 'normal',
  labelScaleAlpha: 1.0,
  labelNonScaleAlpha: 0.35,
  activeGlowRadius: 15,
  activeGlowSpread: 8,
};

export const DEFAULT_THEME = LIGHT_THEME;
