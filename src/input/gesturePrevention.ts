/**
 * Prevent iOS Safari gestures that interfere with the instrument:
 * - Pinch to zoom
 * - Double-tap to zoom
 * - Pull-to-refresh
 * - Context menu on long press
 */
export function preventGestures(element: HTMLElement): () => void {
  const handlers: Array<[string, EventListener, AddEventListenerOptions?]> = [];

  function add(event: string, handler: EventListener, opts?: AddEventListenerOptions) {
    element.addEventListener(event, handler, opts);
    handlers.push([event, handler, opts]);
  }

  // Prevent default touch behaviors
  add('touchstart', (e) => e.preventDefault(), { passive: false });
  add('touchmove', (e) => e.preventDefault(), { passive: false });
  add('touchend', (e) => e.preventDefault(), { passive: false });

  // Prevent context menu on long press
  add('contextmenu', (e) => e.preventDefault());

  // Prevent double-tap zoom
  add('dblclick', (e) => e.preventDefault());

  // Return cleanup function
  return () => {
    for (const [event, handler, opts] of handlers) {
      element.removeEventListener(event, handler, opts);
    }
  };
}
