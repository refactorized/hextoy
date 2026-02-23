import type { AxialCoord, GridConfig, Point } from '../hex/types';
import type { NoteEvent, NoteEventHandler } from '../events/types';
import { pixelToHex } from '../hex/coords';
import { coordToMidiNote } from '../hex/layout';

export type GlissandoMode = 'legato' | 'staccato';

/** Max time a note can stay on before auto-release (ms). */
const MAX_NOTE_DURATION = 10_000;

interface ActivePointer {
  pointerId: number;
  currentHex: string;
  midiNote: number;
  startTime: number;
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
  private panicHandler: (() => void) | null = null;
  private velocity: number = 0.8;
  private glissandoMode: GlissandoMode = 'legato';
  private staleCheckInterval: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.bindEvents();
    this.startStaleCheck();
  }

  setGridConfig(config: GridConfig): void {
    // Release all notes when layout changes — pointers are mapped to wrong notes
    const layoutChanged = this.gridConfig &&
      (this.gridConfig.layout.intervalQ !== config.layout.intervalQ ||
       this.gridConfig.layout.intervalR !== config.layout.intervalR ||
       this.gridConfig.rootNote !== config.rootNote);
    this.gridConfig = config;
    if (layoutChanged) {
      this.releaseAll();
    }
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

  onPanic(handler: () => void): void {
    this.panicHandler = handler;
  }

  /** Release all active pointers and their notes. */
  releaseAll(): void {
    for (const pointer of this.pointers.values()) {
      this.emitNote('noteOff', pointer.midiNote);
    }
    this.pointers.clear();
    this.emitActiveChange();
  }

  /** Full panic: release all notes via both touch and audio engine. */
  panic(): void {
    this.releaseAll();
    this.panicHandler?.();
  }

  destroy(): void {
    this.releaseAll();
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('pointercancel', this.handlePointerUp);
    document.removeEventListener('pointerup', this.handleDocumentPointerUp);
    document.removeEventListener('pointercancel', this.handleDocumentPointerUp);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('blur', this.handleWindowBlur);
    if (this.staleCheckInterval) {
      clearInterval(this.staleCheckInterval);
    }
  }

  private bindEvents(): void {
    // Canvas-level events
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointermove', this.handlePointerMove);
    this.canvas.addEventListener('pointerup', this.handlePointerUp);
    this.canvas.addEventListener('pointercancel', this.handlePointerUp);

    // Document-level safety net for missed pointerup events
    document.addEventListener('pointerup', this.handleDocumentPointerUp);
    document.addEventListener('pointercancel', this.handleDocumentPointerUp);

    // Release all notes when tab loses focus or becomes hidden
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    window.addEventListener('blur', this.handleWindowBlur);
  }

  /** Periodically check for stale notes that exceeded max duration. */
  private startStaleCheck(): void {
    this.staleCheckInterval = window.setInterval(() => {
      const now = performance.now();
      for (const [id, pointer] of this.pointers) {
        if (now - pointer.startTime > MAX_NOTE_DURATION) {
          this.emitNote('noteOff', pointer.midiNote);
          this.pointers.delete(id);
        }
      }
      if (this.pointers.size === 0) return;
      this.emitActiveChange();
    }, 1000);
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
      startTime: performance.now(),
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
    if (key === pointer.currentHex) return;

    const newMidiNote = coordToMidiNote(hex, this.gridConfig.layout, this.gridConfig.rootNote);

    if (this.glissandoMode === 'legato') {
      this.emitNote('noteOn', newMidiNote);
      this.emitNote('noteOff', pointer.midiNote);
    } else {
      this.emitNote('noteOff', pointer.midiNote);
      this.emitNote('noteOn', newMidiNote);
    }

    pointer.currentHex = key;
    pointer.midiNote = newMidiNote;
    pointer.startTime = performance.now();
    this.emitActiveChange();
  };

  private handlePointerUp = (e: PointerEvent): void => {
    const pointer = this.pointers.get(e.pointerId);
    if (!pointer) return;

    this.emitNote('noteOff', pointer.midiNote);
    this.pointers.delete(e.pointerId);
    this.emitActiveChange();
  };

  /** Safety net: catch pointerup events that the canvas missed. */
  private handleDocumentPointerUp = (e: PointerEvent): void => {
    if (this.pointers.has(e.pointerId)) {
      this.handlePointerUp(e);
    }
  };

  private handleVisibilityChange = (): void => {
    if (document.hidden) {
      this.panic();
    }
  };

  private handleWindowBlur = (): void => {
    this.panic();
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
