/** The contract between all modules. */
export interface NoteEvent {
  type: 'noteOn' | 'noteOff';
  note: number;        // MIDI note number 0-127
  velocity: number;    // 0.0-1.0
  timestamp: number;   // performance.now()
}

/** Callback that handles note events. */
export type NoteEventHandler = (event: NoteEvent) => void;

/** Transform/middleware that can modify note events before passing them on. */
export type NoteEventTransform = (event: NoteEvent, next: NoteEventHandler) => void;
