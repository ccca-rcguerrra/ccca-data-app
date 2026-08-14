import MapboxDraw from 'maplibre-gl-draw';
import DrawRectangleMode from './draw-rectangle-mode';
import DrawCircleMode from './draw-circle-mode';
import DirectSelectDeleteVertex from './direct-select-delete-vertex-mode';
import SimpleSelectDirectEdit from './simple-select-direct-mode';
import { DeleteModeControl } from './delete-mode-control';
import { drawTheme } from './draw-theme';

const DEBUG = import.meta.env.DEV;
function debugDraw(...args: unknown[]) {
  if (!DEBUG) return;
  console.log('[draw-debug][extended]', ...args);
}

// ─────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────

export interface ExtendedDrawCallbacks {
  onFeatureCreate?: (feature: GeoJSON.Feature) => void;
  onFeatureUpdate?: (feature: GeoJSON.Feature) => void;
  onFeatureDelete?: () => void;
  onGeometriesChange?: (geometries: GeoJSON.FeatureCollection) => void;
}

export interface ExtendedDrawOptions {
  displayControlsDefault?: boolean;
  controls?: { polygon?: boolean; trash?: boolean };
  defaultMode?: 'draw_polygon' | 'draw_rectangle' | 'draw_circle' | 'simple_select' | 'direct_select';
  continuousDraw?: boolean;
  /** Maximum number of features allowed. When a new feature is created and exceeds this limit,
   *  the oldest features are removed silently (before callbacks fire). Use 1 for single-geometry tools. */
  maxFeatures?: number;
}

// ─────────────────────────────────────────────
// ExtendedMapboxDraw
//
// Owns all mode-switching behaviour:
//   - mode tracking (lastDrawMode, always updated on changeMode / modechange event)
//   - continuous draw re-entry after draw.create
//   - map event wiring (in onAdd) and unwiring (in onRemove)
//   - toolbar button injection (polygon / rectangle / circle) and their
//     shared active-state, kept in sync via the modechange event
//
// Delete-mode behaviour (trash button + Save/Cancel/Clear All bar) lives in
// DeleteModeControl; ExtendedMapboxDraw acts as its host.
//
// DrawingControls only needs to add/remove this control from the map
// and call setCallbacks() when React props change.
// ─────────────────────────────────────────────

export class ExtendedMapboxDraw {
  private readonly draw: MapboxDraw;
  private map: any | null = null;

  private lastDrawMode: string | null = null;
  private pendingContinuousMode: string | null = null;
  private reenterTimer: ReturnType<typeof setTimeout> | null = null;

  private isContinuousDraw: boolean;
  private maxFeatures: number | undefined;
  private readonly defaultMode: string;

  private readonly deleteControl: DeleteModeControl;

  // Custom toolbar buttons and the draw mode each one activates.
  private readonly toolButtons: Array<{ el: HTMLButtonElement; mode: string }> = [];

  callbacks: ExtendedDrawCallbacks = {};

  // Stable bound handlers — same reference required for map.on / map.off
  private readonly boundHandleDrawEvent: (e: any) => void;
  private readonly boundHandleModeChange: (e: any) => void;

  constructor(options: ExtendedDrawOptions = {}) {
    const { continuousDraw = true, defaultMode = 'draw_polygon', maxFeatures, ...drawOptions } = options;
    this.isContinuousDraw = continuousDraw;
    this.maxFeatures = maxFeatures;
    this.defaultMode = defaultMode;

    this.draw = new MapboxDraw({
      // Custom theme with larger vertex/midpoint circles for easier editing.
      // Callers may still override by passing their own `styles`.
      styles: drawTheme,
      ...drawOptions,
      modes: {
        ...(MapboxDraw as any).modes,
        draw_rectangle: DrawRectangleMode,
        draw_circle: DrawCircleMode,
        // Override the native direct_select with Ctrl+click vertex removal.
        direct_select: DirectSelectDeleteVertex,
        // Override simple_select so a single click enters vertex editing.
        simple_select: SimpleSelectDirectEdit,
      },
    } as any);

    this.boundHandleDrawEvent = this.handleDrawEvent.bind(this);
    this.boundHandleModeChange = this.handleModeChange.bind(this);
    this.deleteControl = new DeleteModeControl(this);
  }

  // ─── IControl ────────────────────────────────────────────────────────────

  onAdd(map: any): HTMLElement {
    this.map = map;
    const container = (this.draw as any).onAdd(map) as HTMLElement;
    // Native controls are disabled (controls: {}); we own every button so the
    // active-state can be coordinated across all of them from one place.
    this.injectToolButton(container, { mode: 'draw_polygon', className: 'mapbox-gl-draw_polygon', title: 'Draw Polygon' });
    this.injectToolButton(container, { mode: 'draw_rectangle', className: 'mapbox-gl-draw_rectangle', title: 'Draw Rectangle' });
    this.injectToolButton(container, { mode: 'draw_circle', className: 'mapbox-gl-draw_circle', title: 'Draw Circle' });
    this.deleteControl.inject(map, container);

    map.on('draw.create', this.boundHandleDrawEvent);
    map.on('draw.update', this.boundHandleDrawEvent);
    map.on('draw.delete', this.boundHandleDrawEvent);
    map.on('draw.modechange', this.boundHandleModeChange);
    debugDraw('onAdd: events wired');
    return container;
  }

  onRemove(map: any): void {
    this.cancelTimer();
    this.deleteControl.destroy();
    map.off('draw.create', this.boundHandleDrawEvent);
    map.off('draw.update', this.boundHandleDrawEvent);
    map.off('draw.delete', this.boundHandleDrawEvent);
    map.off('draw.modechange', this.boundHandleModeChange);
    try { (this.draw as any).onRemove(map); } catch { }
    this.map = null;
    debugDraw('onRemove: events unwired');
  }

  // ─── MapboxDraw data passthrough ─────────────────────────────────────────

  add(geojson: GeoJSON.Feature | GeoJSON.FeatureCollection): string[] {
    return this.draw.add(geojson as any);
  }

  get(id: string): GeoJSON.Feature | undefined {
    return this.draw.get(id);
  }

  getAll(): GeoJSON.FeatureCollection {
    if (!this.map) {
      return { type: 'FeatureCollection', features: [] };
    }
    return this.draw.getAll();
  }

  delete(ids: string | string[]): this {
    this.draw.delete(ids as any);
    return this;
  }

  deleteAll(): this {
    this.draw.deleteAll();
    return this;
  }

  getMode(): string {
    try { return (this.draw as any).getMode?.() ?? 'simple_select'; } catch { return 'simple_select'; }
  }

  // ─── Extended API ─────────────────────────────────────────────────────────

  /**
   * changeMode with internal mode tracking.
   * Always use this instead of accessing draw.changeMode directly.
   */
  changeMode(mode: string, options?: object): this {
    if (!this.map) return this;
    try {
      this.draw.changeMode(mode as any, options as any);
      this.trackMode(mode);
      // The public draw.changeMode fires 'draw.modechange' with { silent: true },
      // so the modechange handler never runs for programmatic switches — sync now.
      this.syncMode(mode);
      debugDraw('changeMode', { mode });
    } catch (err) {
      console.warn('[ExtendedDraw] changeMode error:', err);
    }
    return this;
  }

  /**
   * Loads a FeatureCollection and enters simple_select (or restores
   * direct_select if the user was editing vertices before the update).
   */
  setGeometry(geometry: GeoJSON.FeatureCollection): void {
    if (!this.map) return;
    debugDraw('setGeometry', { features: geometry?.features?.length ?? 0 });

    let wasEditingVertices = false;
    try { wasEditingVertices = this.getMode() === 'direct_select'; } catch { }

    try { this.draw.deleteAll(); } catch { }
    if (geometry?.type === 'FeatureCollection') {
      try { this.draw.add(geometry as any); } catch { }
    }

    try {
      if (wasEditingVertices) {
        const first = this.draw.getAll().features[0];
        if (first?.id) {
          this.draw.changeMode('direct_select' as any, { featureId: first.id });
        } else {
          this.changeMode('simple_select');
        }
      } else {
        this.changeMode('simple_select');
      }
    } catch { }
  }

  setContinuousDraw(enabled: boolean): void {
    this.isContinuousDraw = enabled;
  }

  setMaxFeatures(n: number | undefined): void {
    this.maxFeatures = n;
  }

  setCallbacks(callbacks: ExtendedDrawCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Finalizes any active draw mode before the caller reads the geometry on exit.
   *
   * Continuous draw re-arms the active draw mode after each create. The native
   * `draw_polygon` mode adds an empty placeholder feature to the store in its
   * onSetup, so a re-armed polygon tool leaves a phantom (coordinate-less)
   * feature behind. Switching to `simple_select` runs that mode's onStop, which
   * discards the incomplete placeholder — otherwise getAll() reports an extra,
   * invisible feature and single-geometry validation (e.g. envelope) fails.
   */
  finalizeDrawing(): void {
    if (!this.map) return;
    this.cancelTimer();
    this.pendingContinuousMode = null;
    const mode = this.getMode();
    if (typeof mode === 'string' && mode.startsWith('draw_')) {
      this.changeMode('simple_select');
    }
  }

  /** Release pending timers and delete-mode state. Call when the component unmounts. */
  destroy(): void {
    this.cancelTimer();
    this.deleteControl.destroy();
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  private trackMode(mode: string | null | undefined): void {
    if (typeof mode === 'string' && mode.startsWith('draw_')) {
      this.lastDrawMode = mode;
    }
  }

  private getContinuousTargetMode(): string | null {
    if (this.lastDrawMode?.startsWith('draw_')) return this.lastDrawMode;
    if (this.defaultMode?.startsWith('draw_')) return this.defaultMode;
    return null;
  }

  private cancelTimer(): void {
    if (this.reenterTimer !== null) {
      clearTimeout(this.reenterTimer);
      this.reenterTimer = null;
    }
  }

  private scheduleContinuousReenter(targetMode: string): void {
    this.cancelTimer();
    this.pendingContinuousMode = targetMode;
    debugDraw('continuous:queue', { targetMode });
    this.reenterTimer = setTimeout(() => this.attemptContinuousReenter(), 0);
  }

  private attemptContinuousReenter(): void {
    const mode = this.pendingContinuousMode;
    if (!mode || !this.map) return;
    try {
      debugDraw('continuous:reenter:attempt', { mode });
      this.draw.changeMode(mode as any);
      this.trackMode(mode);
      this.syncMode(mode);
      this.pendingContinuousMode = null;
      this.reenterTimer = null;
      debugDraw('continuous:reenter:success', { mode });
    } catch (err) {
      console.warn('[ExtendedDraw] continuous reenter error:', err);
    }
  }

  private handleModeChange(e: any): void {
    const mode = e?.mode;
    debugDraw('event:modechange', { mode });
    this.trackMode(mode);
    this.syncMode(mode);
    // After draw.create, mode transitions to simple_select.
    // Re-schedule here so the re-entry runs after the transition is complete.
    if (mode === 'simple_select' && this.pendingContinuousMode) {
      const target = this.pendingContinuousMode;
      this.scheduleContinuousReenter(target);
    }
  }

  /**
   * Reflects the current mode across the toolbar and delete control. Must be
   * driven from every mode-change path (programmatic and event-driven), since
   * the silent draw.changeMode does not emit draw.modechange.
   */
  private syncMode(mode: string | null | undefined): void {
    this.updateToolbarActive(mode);
    this.deleteControl.handleHostModeChange(mode);
  }

  /** Highlights the toolbar button matching the current mode (or none). */
  private updateToolbarActive(mode: string | null | undefined): void {
    for (const { el, mode: btnMode } of this.toolButtons) {
      el.classList.toggle('active', mode === btnMode);
    }
  }

  /**
   * Removes oldest features silently (without firing draw.delete) to enforce maxFeatures.
   * Called before capturing data so onGeometriesChange receives the already-trimmed state.
   */
  private enforceMaxFeatures(newFeatureId: string | undefined): void {
    if (this.maxFeatures === undefined) return;
    const all = this.draw.getAll();
    if (all.features.length <= this.maxFeatures) return;

    const excess = all.features.length - this.maxFeatures;
    const idsToDelete = all.features
      .filter((f) => f.id !== newFeatureId)
      .slice(0, excess)
      .map((f) => f.id as string)
      .filter(Boolean);

    if (idsToDelete.length === 0) return;

    // Temporarily suppress draw.delete so this internal cleanup doesn't
    // trigger another onGeometriesChange call with an empty / stale state.
    this.map?.off('draw.delete', this.boundHandleDrawEvent);
    try {
      this.draw.delete(idsToDelete);
    } finally {
      this.map?.on('draw.delete', this.boundHandleDrawEvent);
    }
    debugDraw('maxFeatures:enforced', { removed: idsToDelete, kept: this.maxFeatures });
  }

  private handleDrawEvent(e: any): void {
    if (e.type === 'draw.create' && this.maxFeatures !== undefined) {
      const newId = e.features?.[e.features.length - 1]?.id as string | undefined;
      this.enforceMaxFeatures(newId);
    }

    const data = this.draw.getAll();
    debugDraw('event', {
      type: e?.type,
      featuresInEvent: e?.features?.length ?? 0,
      totalFeatures: data?.features?.length ?? 0,
      mode: this.getMode(),
    });

    if (e.type === 'draw.create' && e.features?.length > 0) {
      this.callbacks.onFeatureCreate?.(e.features[e.features.length - 1]);
    } else if (e.type === 'draw.update' && e.features?.length > 0) {
      this.callbacks.onFeatureUpdate?.(e.features[0]);
    } else if (e.type === 'draw.delete') {
      this.callbacks.onFeatureDelete?.();
    }

    this.callbacks.onGeometriesChange?.(data);

    if (e.type === 'draw.create' && this.isContinuousDraw) {
      const target = this.getContinuousTargetMode();
      if (target) {
        this.scheduleContinuousReenter(target);
      } else {
        debugDraw('continuous:skip:no-target-mode');
      }
    }
  }

  /**
   * Creates a toolbar button that toggles its draw mode (clicking it again
   * while active returns to simple_select). Appended in call order and tracked
   * for active-state coordination.
   */
  private injectToolButton(
    container: HTMLElement,
    opts: { mode: string; className: string; title: string },
  ): void {
    const btn = document.createElement('button');
    btn.className = `mapbox-gl-draw_ctrl-draw-btn ${opts.className}`;
    btn.type = 'button';
    btn.title = opts.title;
    btn.addEventListener('click', () => {
      try {
        this.changeMode(this.getMode() === opts.mode ? 'simple_select' : opts.mode);
      } catch (e) {
        console.warn(e);
      }
    });
    container.appendChild(btn);
    this.toolButtons.push({ el: btn, mode: opts.mode });
  }

}

export function createExtendedDraw(options?: ExtendedDrawOptions): ExtendedMapboxDraw {
  return new ExtendedMapboxDraw(options);
}
