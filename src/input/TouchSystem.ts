import type { AxialCoord, GridConfig, Point, HexCell } from '../hex/types';
import type { NoteEvent, NoteEventHandler } from '../events/types';
import { pixelToHex } from '../hex/coords';
import { coordToMidiNote } from '../hex/layout';

export type GlissandoMode = 'legato' | 'staccato';

interface ActivePointer {
  pointerId: number;
  currentHex: string; // "q,r" key
  midiNote: number;
}

function hexKey(coord: AxialCoord): string {
  return `${coord.q},${coord.r}`;
}

export class TouchSystem {
  private canvas: HTMLCanvasElement;
  private gridConfig!: GridConfig;
  private origin: Point = { x: 0, y: 0 };
  private pointers: Map<number, ActivePointer> = new Map();
  private noteHandler: NoteEventHandler | null = null;
  private activeChangeHandler: ((activeNotes: Set<number>) => void) | null = null;
  private velocity: number = 0.8;
  private glissandoMode: GlissandoMode = 'legato';

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.bindEvents();
  }

  setGridConfig(config: GridConfig): void {
    this.gridConfig = config;
  }

  setOrigin(origin: Point): void {
    this.origin = origin;
  }

  setVelocity(v: number): void {
    this.velocity = v;
  }

  setGlissandoMode(mode: GlissandoMode): void {
    this.glissandoMode = mode;
  }

  onNoteEvent(handler: NoteEventHandler): void {
    this.noteHandler = handler;
  }

  onActiveChange(handler: (activeNotes: Set<number>) => void): void {
    this.activeChangeHandler = handler;
  }

  private bindEvents(): void {
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointermove', this.handlePointerMove);
    this.canvas.addEventListener('pointerup', this.handlePointerUp);
    this.canvas.addEventListener('pointercancel', this.handlePointerUp);
  }

  destroy(): void {
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('pointercancel', this.handlePointerUp);
  }

  private handlePointerDown = (e: PointerEvent): void => {
    e.preventDefault();
    this.canvas.setPointerCapture(e.pointerId);

    const hex = this.getHexAtEvent(e);
    if (!hex) return;

    const key = hexKey(hex);
    const midiNote = coordToMidiNote(hex, this.gridConfig.layout, this.gridConfig.rootNote);

    this.pointers.set(e.pointerId, {
      pointerId: e.pointerId,
      currentHex: key,
      midiNote,
    });

    this.emitNote('noteOn', midiNote);
    this.emitActiveChange();
  };

  private handlePointerMove = (e: PointerEvent): void => {
    const pointer = this.pointers.get(e.pointerId);
    if (!pointer) return;

    const hex = this.getHexAtEvent(e);
    if (!hex) return;

    const key = hexKey(hex);
    if (key === pointer.currentHex) return; // Still on same hex

    const newMidiNote = coordToMidiNote(hex, this.gridConfig.layout, this.gridConfig.rootNote);

    if (this.glissandoMode === 'legato') {
      // Legato: new note ON before old note OFF
      this.emitNote('noteOn', newMidiNote);
      this.emitNote('noteOff', pointer.midiNote);
    } else {
      // Staccato: old note OFF before new note ON
      this.emitNote('noteOff', pointer.midiNote);
      this.emitNote('noteOn', newMidiNote);
    }

    pointer.currentHex = key;
    pointer.midiNote = newMidiNote;
    this.emitActiveChange();
  };

  private handlePointerUp = (e: PointerEvent): void => {
    const pointer = this.pointers.get(e.pointerId);
    if (!pointer) return;

    this.emitNote('noteOff', pointer.midiNote);
    this.pointers.delete(e.pointerId);
    this.emitActiveChange();
  };

  private getHexAtEvent(e: PointerEvent): AxialCoord | null {
    if (!this.gridConfig) return null;
    const rect = this.canvas.getBoundingClientRect();
    const point: Point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    return pixelToHex(point, this.gridConfig.hexSize, this.origin);
  }

  private emitNote(type: 'noteOn' | 'noteOff', note: number): void {
    if (!this.noteHandler) return;
    this.noteHandler({
      type,
      note,
      velocity: type === 'noteOn' ? this.velocity : 0,
      timestamp: performance.now(),
    });
  }

  private emitActiveChange(): void {
    if (!this.activeChangeHandler) return;
    const notes = new Set<number>();
    for (const pointer of this.pointers.values()) {
      notes.add(pointer.midiNote);
    }
    this.activeChangeHandler(notes);
  }
}
