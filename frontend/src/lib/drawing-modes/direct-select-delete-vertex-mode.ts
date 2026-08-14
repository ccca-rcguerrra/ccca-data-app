import MapboxDraw from 'maplibre-gl-draw';

// ─────────────────────────────────────────────
// DirectSelectDeleteVertex
//
// Extends the native `direct_select` mode with two removal gestures:
//   • Alt + click on a vertex      → removes that single vertex.
//   • Alt + Shift + drag           → box-delete: removes every vertex inside
//                                     the dragged rectangle.
//
// Plain click/drag still moves a vertex (native behaviour untouched), so the
// gestures don't collide. The box gesture is the practical way to thin out very
// dense geometries where vertices stack on the same pixel and single clicks can
// only peel them off one at a time.
//
// Both paths guard the minimum: a polygon ring never drops below a triangle
// (3 distinct vertices), a line never below a segment (2), so removeCoordinate
// can't silently delete the whole ring/feature.
// ─────────────────────────────────────────────

const DEBUG = import.meta.env.DEV;
function debugVertex(...args: unknown[]) {
  if (!DEBUG) return;
  console.log('[draw-debug][delete-vertex]', ...args);
}

const DirectSelect = (MapboxDraw as any).modes.direct_select;

/** True when the event target is a polygon/line vertex handle. */
function isVertexTarget(e: any): boolean {
  return e?.featureTarget?.properties?.meta === 'vertex';
}

/** Single-vertex delete modifier: Alt without Shift (Shift switches to box mode). */
function hasDeleteModifier(e: any): boolean {
  const oe = e?.originalEvent;
  return !!(oe && oe.altKey && !oe.shiftKey);
}

/** Box-delete modifier: Alt + Shift. */
function hasBoxDeleteModifier(e: any): boolean {
  const oe = e?.originalEvent;
  return !!(oe && oe.altKey && oe.shiftKey);
}

/**
 * Walks `coords` (the structure returned by feature.getCoordinates()) down to
 * the ring/line array that contains the vertex addressed by `coordPath`.
 * Works for LineString ("i"), Polygon ("r.i") and MultiPolygon ("p.r.i").
 */
function getContainingRing(coords: any, coordPath: string): any[] | null {
  const parts = coordPath.split('.').map((n) => parseInt(n, 10));
  let node = coords;
  for (let k = 0; k < parts.length - 1; k++) {
    node = node?.[parts[k]];
    if (!node) return null;
  }
  return Array.isArray(node) ? node : null;
}

type VertexEntry = { path: string; ringKey: string; lng: number; lat: number };

/**
 * Flattens a feature's vertices to { path, ringKey, lng, lat }. Polygon rings are
 * closed by getCoordinates() (last == first), so the closing point is skipped.
 * `ringKey` groups vertices per ring for the per-ring minimum enforcement.
 */
function collectVertexPaths(feature: any): VertexEntry[] {
  const out: VertexEntry[] = [];
  const coords = feature.getCoordinates();
  switch (feature.type) {
    case 'Polygon':
      (coords as number[][][]).forEach((ring, r) => {
        for (let i = 0; i < ring.length - 1; i++) out.push({ path: `${r}.${i}`, ringKey: `${r}`, lng: ring[i][0], lat: ring[i][1] });
      });
      break;
    case 'MultiPolygon':
      (coords as number[][][][]).forEach((poly, p) => {
        poly.forEach((ring, r) => {
          for (let i = 0; i < ring.length - 1; i++) out.push({ path: `${p}.${r}.${i}`, ringKey: `${p}.${r}`, lng: ring[i][0], lat: ring[i][1] });
        });
      });
      break;
    case 'LineString':
      (coords as number[][]).forEach((pt, i) => out.push({ path: `${i}`, ringKey: 'L', lng: pt[0], lat: pt[1] }));
      break;
    case 'MultiLineString':
      (coords as number[][][]).forEach((line, l) => {
        line.forEach((pt, i) => out.push({ path: `${l}.${i}`, ringKey: `${l}`, lng: pt[0], lat: pt[1] }));
      });
      break;
  }
  return out;
}

const DirectSelectDeleteVertex = {
  ...DirectSelect,

  // ─── Whole-feature move disabled ─────────────────────────────────────────────

  // Native direct_select drags the whole feature when the pointer grabs the body
  // (no vertex selected). We only want vertex editing, so this is a no-op —
  // dragVertex still runs when a vertex handle is grabbed (see native onDrag).
  dragFeature(this: any, _state: any, _e: any, _delta: any): void {
    /* moving the entire geometry is intentionally disabled */
  },

  // ─── Single vertex (Ctrl + click) ──────────────────────────────────────────

  /**
   * Removes the vertex addressed by the event target, unless doing so would
   * make the feature invalid (below a triangle for polygons / a segment for
   * lines). Fires draw.update so the host syncs the new geometry.
   */
  removeVertexWithModifier(this: any, state: any, e: any): void {
    const feature = state.feature;
    const coordPath: string | undefined = e.featureTarget?.properties?.coord_path;
    if (!coordPath) return;

    const isPolygon = feature.type === 'Polygon' || feature.type === 'MultiPolygon';
    const ring = getContainingRing(feature.getCoordinates(), coordPath);
    if (!ring) return;
    const distinct = isPolygon ? ring.length - 1 : ring.length;
    const minVertices = isPolygon ? 3 : 2;

    if (distinct <= minVertices) {
      debugVertex('blocked: at minimum', { coordPath, distinct, minVertices });
      return;
    }

    feature.removeCoordinate(coordPath);
    this.fireUpdate();
    state.selectedCoordPaths = [];
    this.clearSelectedCoordinates();
    this.fireActionable(state);
    // The click event that follows this mousedown would land where the vertex
    // used to be — often over empty space — and native onClick would treat it
    // as a click-off and exit to simple_select. Suppress that one click.
    state.suppressNextClick = true;
    debugVertex('removed', { coordPath, remaining: distinct - 1 });
  },

  // ─── Box delete (Ctrl + Alt + drag) ─────────────────────────────────────────

  startBoxDelete(this: any, state: any, e: any): void {
    this.map.dragPan.disable();
    // Shift + drag is the MapLibre boxZoom gesture — suppress it for the duration.
    try { this.map.boxZoom?.disable(); } catch { /* noop */ }
    const el = document.createElement('div');
    el.className = 'draw-box-delete';
    Object.assign(el.style, {
      position: 'absolute',
      border: '1px dashed #e11d48',
      background: 'rgba(225, 29, 72, 0.12)',
      pointerEvents: 'none',
      zIndex: '10',
      left: `${e.point.x}px`,
      top: `${e.point.y}px`,
      width: '0px',
      height: '0px',
    });
    this.map.getContainer().appendChild(el);
    state.boxDelete = { startX: e.point.x, startY: e.point.y, el };
    this.updateUIClasses({ mouse: 'add' });
    debugVertex('box:start', { x: e.point.x, y: e.point.y });
  },

  updateBoxDelete(this: any, state: any, e: any): void {
    const box = state.boxDelete;
    if (!box) return;
    const minX = Math.min(box.startX, e.point.x);
    const minY = Math.min(box.startY, e.point.y);
    box.el.style.left = `${minX}px`;
    box.el.style.top = `${minY}px`;
    box.el.style.width = `${Math.abs(e.point.x - box.startX)}px`;
    box.el.style.height = `${Math.abs(e.point.y - box.startY)}px`;
  },

  cleanupBoxDelete(this: any, state: any): void {
    const box = state.boxDelete;
    if (box?.el) box.el.remove();
    state.boxDelete = null;
    try { this.map?.dragPan?.enable(); } catch { /* map may be gone on stop */ }
    try { this.map?.boxZoom?.enable(); } catch { /* map may be gone on stop */ }
  },

  finishBoxDelete(this: any, state: any, e: any): void {
    const box = state.boxDelete;
    this.cleanupBoxDelete(state);
    if (!box) return;

    const minX = Math.min(box.startX, e.point.x);
    const maxX = Math.max(box.startX, e.point.x);
    const minY = Math.min(box.startY, e.point.y);
    const maxY = Math.max(box.startY, e.point.y);

    const feature = state.feature;
    const isPolygon = feature.type === 'Polygon' || feature.type === 'MultiPolygon';
    const minVertices = isPolygon ? 3 : 2;

    const all = collectVertexPaths(feature);
    const ringTotals = new Map<string, number>();
    for (const v of all) ringTotals.set(v.ringKey, (ringTotals.get(v.ringKey) ?? 0) + 1);

    // Vertices whose projected pixel falls inside the dragged rectangle.
    const inside = all.filter((v) => {
      const p = this.map.project([v.lng, v.lat]);
      return p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY;
    });

    // Enforce the per-ring minimum: never remove so many that a ring drops below
    // a triangle / segment.
    const byRing = new Map<string, VertexEntry[]>();
    for (const v of inside) {
      const list = byRing.get(v.ringKey) ?? [];
      list.push(v);
      byRing.set(v.ringKey, list);
    }
    const toRemove: string[] = [];
    for (const [ringKey, list] of byRing) {
      const allowed = Math.max(0, (ringTotals.get(ringKey) ?? 0) - minVertices);
      for (const v of list.slice(0, allowed)) toRemove.push(v.path);
    }

    if (!toRemove.length) {
      debugVertex('box:nothing-removed', { insideCount: inside.length });
      return;
    }

    // Remove in numeric-descending path order so earlier removals don't shift
    // the indices of later ones (mirrors native onTrash).
    toRemove.sort((a, b) => b.localeCompare(a, 'en', { numeric: true }));
    for (const path of toRemove) feature.removeCoordinate(path);

    this.fireUpdate();
    state.selectedCoordPaths = [];
    this.clearSelectedCoordinates();
    this.fireActionable(state);
    debugVertex('box:removed', { count: toRemove.length });
  },

  // ─── Event hooks ─────────────────────────────────────────────────────────────

  onMouseDown(this: any, state: any, e: any) {
    if (hasBoxDeleteModifier(e)) {
      this.startBoxDelete(state, e);
      return;
    }
    if (isVertexTarget(e) && hasDeleteModifier(e)) {
      this.removeVertexWithModifier(state, e);
      return;
    }
    return DirectSelect.onMouseDown.call(this, state, e);
  },

  onDrag(this: any, state: any, e: any) {
    if (state.boxDelete) {
      this.updateBoxDelete(state, e);
      return;
    }
    return DirectSelect.onDrag.call(this, state, e);
  },

  // Fires when the pointer is released after moving (a real drag).
  onMouseUp(this: any, state: any, e: any) {
    if (state.boxDelete) {
      this.finishBoxDelete(state, e);
      return;
    }
    return DirectSelect.onMouseUp.call(this, state);
  },

  // Fires when released without moving (a click). Cancels a started-but-undragged
  // box, and swallows the click that follows a single-vertex delete so the mode
  // stays in vertex-editing instead of falling back to simple_select.
  onClick(this: any, state: any, e: any) {
    if (state.boxDelete) {
      this.cleanupBoxDelete(state);
      return;
    }
    if (state.suppressNextClick) {
      state.suppressNextClick = false;
      this.stopDragging?.(state);
      return;
    }
    return DirectSelect.onClick.call(this, state, e);
  },

  onTap(this: any, state: any, e: any) {
    if (state.suppressNextClick) {
      state.suppressNextClick = false;
      return;
    }
    return DirectSelect.onTap.call(this, state, e);
  },

  // Discoverability cursors: crosshair-style while the box modifier is held,
  // pointer while the single-delete modifier hovers a vertex.
  onMouseMove(this: any, state: any, e: any) {
    if (hasBoxDeleteModifier(e)) {
      this.updateUIClasses({ mouse: 'add' });
      return true;
    }
    if (isVertexTarget(e) && hasDeleteModifier(e)) {
      this.updateUIClasses({ mouse: 'pointer' });
      return true;
    }
    return DirectSelect.onMouseMove.call(this, state, e);
  },

  // Tear down a dangling box if the mode is left mid-drag.
  onStop(this: any, state: any) {
    if (state?.boxDelete) this.cleanupBoxDelete(state);
    return DirectSelect.onStop?.call(this, state);
  },
};

export default DirectSelectDeleteVertex;
