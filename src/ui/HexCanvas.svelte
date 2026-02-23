<script lang="ts">
  import { onMount } from 'svelte';
  import { HexRenderer } from '../renderer/HexRenderer';
  import { generateGrid } from '../hex/grid';
  import type { GridConfig, Point } from '../hex/types';
  import type { Scale } from '../hex/scale';
  import { DEFAULT_THEME } from '../renderer/theme';
  import { TouchSystem, type GlissandoMode } from '../input/TouchSystem';
  import { preventGestures } from '../input/gesturePrevention';
  import type { NoteEventHandler } from '../events/types';

  let {
    gridConfig,
    scale,
    rootPitchClass,
    activeNotes,
    glissandoMode = 'legato',
    onNoteEvent,
    onActiveChange,
  }: {
    gridConfig: GridConfig;
    scale: Scale;
    rootPitchClass: number;
    activeNotes: Set<number>;
    glissandoMode?: GlissandoMode;
    onNoteEvent?: NoteEventHandler;
    onActiveChange?: (notes: Set<number>) => void;
  } = $props();

  let canvasEl: HTMLCanvasElement;
  let renderer: HexRenderer;
  let touchSystem: TouchSystem;
  let containerEl: HTMLDivElement;

  let origin: Point = $state({ x: 0, y: 0 });
  let viewWidth = $state(0);
  let viewHeight = $state(0);

  function updateSize() {
    if (!containerEl) return;
    const rect = containerEl.getBoundingClientRect();
    viewWidth = rect.width;
    viewHeight = rect.height;
    origin = { x: viewWidth / 2, y: viewHeight / 2 };
    renderer?.resize(viewWidth, viewHeight);
    touchSystem?.setOrigin(origin);
    updateRenderState();
  }

  function updateRenderState() {
    if (!renderer || viewWidth === 0) return;
    const cells = generateGrid(gridConfig, viewWidth, viewHeight, origin);
    renderer.setState({
      cells,
      activeNotes,
      hexSize: gridConfig.hexSize,
      scale,
      rootPitchClass,
      theme: DEFAULT_THEME,
    });
  }

  // Update touch system when config changes
  $effect(() => {
    touchSystem?.setGridConfig(gridConfig);
  });

  $effect(() => {
    touchSystem?.setGlissandoMode(glissandoMode);
  });

  // Re-render when props change
  $effect(() => {
    gridConfig; scale; rootPitchClass; activeNotes;
    updateRenderState();
  });

  onMount(() => {
    renderer = new HexRenderer(canvasEl);
    touchSystem = new TouchSystem(canvasEl);
    touchSystem.setGridConfig(gridConfig);
    touchSystem.setOrigin(origin);
    touchSystem.setGlissandoMode(glissandoMode);

    if (onNoteEvent) touchSystem.onNoteEvent(onNoteEvent);
    if (onActiveChange) touchSystem.onActiveChange(onActiveChange);

    const cleanupGestures = preventGestures(canvasEl);
    updateSize();

    // Render loop
    let animFrameId: number;
    function loop() {
      renderer.renderIfDirty();
      animFrameId = requestAnimationFrame(loop);
    }
    animFrameId = requestAnimationFrame(loop);

    const ro = new ResizeObserver(() => updateSize());
    ro.observe(containerEl);

    return () => {
      cancelAnimationFrame(animFrameId);
      ro.disconnect();
      touchSystem.destroy();
      cleanupGestures();
    };
  });
</script>

<div bind:this={containerEl} class="hex-canvas-container">
  <canvas bind:this={canvasEl}></canvas>
</div>

<style>
  .hex-canvas-container {
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: relative;
  }
  canvas {
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    touch-action: none;
  }
</style>
