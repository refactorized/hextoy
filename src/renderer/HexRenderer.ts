import type { HexCell, Point } from '../hex/types';
import type { Scale } from '../hex/scale';
import { hexVertices } from '../hex/coords';
import { pitchClassColor, pitchClassActiveColor, pitchClassGlowColor } from '../hex/color';
import { isInScale } from '../hex/scale';
import { DEFAULT_THEME, type Theme } from './theme';

export interface RenderState {
  cells: HexCell[];
  activeNotes: Set<number>;   // set of MIDI note numbers currently pressed
  hexSize: number;
  scale: Scale;
  rootPitchClass: number;
  theme: Theme;
}

export class HexRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private dpr: number = 1;
  private dirty: boolean = true;
  private state: RenderState | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.updateDpr();
  }

  /** Update devicePixelRatio and resize canvas backing store. */
  updateDpr(): void {
    this.dpr = window.devicePixelRatio || 1;
  }

  /** Resize canvas to fill its CSS dimensions with correct DPR. */
  resize(width: number, height: number): void {
    this.canvas.width = width * this.dpr;
    this.canvas.height = height * this.dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.dirty = true;
  }

  /** Update render state and mark dirty. */
  setState(state: RenderState): void {
    this.state = state;
    this.dirty = true;
  }

  /** Mark as needing redraw. */
  markDirty(): void {
    this.dirty = true;
  }

  /** Only render if dirty. Returns whether it rendered. */
  renderIfDirty(): boolean {
    if (!this.dirty || !this.state) return false;
    this.render(this.state);
    this.dirty = false;
    return true;
  }

  /** Full render pass. */
  private render(state: RenderState): void {
    const { cells, activeNotes, hexSize, scale, rootPitchClass, theme } = state;
    const ctx = this.ctx;
    const w = this.canvas.width / this.dpr;
    const h = this.canvas.height / this.dpr;

    // Clear
    ctx.fillStyle = theme.background;
    ctx.fillRect(0, 0, w, h);

    // Draw all hexes
    for (const cell of cells) {
      const isActive = activeNotes.has(cell.midiNote);
      const inScale = isInScale(cell.midiNote, rootPitchClass, scale);
      this.drawHex(ctx, cell, hexSize, isActive, inScale, theme);
    }
  }

  private drawHex(
    ctx: CanvasRenderingContext2D,
    cell: HexCell,
    size: number,
    isActive: boolean,
    inScale: boolean,
    theme: Theme,
  ): void {
    const vertices = hexVertices(cell.center, size);

    // Draw hex fill
    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    for (let i = 1; i < 6; i++) {
      ctx.lineTo(vertices[i].x, vertices[i].y);
    }
    ctx.closePath();

    if (isActive) {
      // Active glow effect
      ctx.save();
      ctx.shadowColor = pitchClassGlowColor(cell.pitchClass);
      ctx.shadowBlur = theme.activeGlowRadius;
      ctx.fillStyle = pitchClassActiveColor(cell.pitchClass);
      ctx.fill();
      ctx.restore();
    } else {
      ctx.fillStyle = pitchClassColor(cell.pitchClass);
      ctx.fill();
    }

    // Stroke
    ctx.strokeStyle = theme.hexStroke;
    ctx.lineWidth = theme.hexStrokeWidth;
    ctx.stroke();

    // Label
    const fontSize = Math.max(9, size * 0.35);
    ctx.font = `${inScale ? theme.labelScaleFont : theme.labelNonScaleFont} ${fontSize}px sans-serif`;
    ctx.fillStyle = theme.labelColor;
    ctx.globalAlpha = inScale ? theme.labelScaleAlpha : theme.labelNonScaleAlpha;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cell.noteName, cell.center.x, cell.center.y);
    ctx.globalAlpha = 1;
  }
}
