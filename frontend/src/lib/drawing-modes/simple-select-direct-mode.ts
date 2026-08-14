import MapboxDraw from 'maplibre-gl-draw';
import { deleteModeState } from './delete-mode-state';

// ─────────────────────────────────────────────
// SimpleSelectDirectEdit
//
// Extends the native `simple_select` so a single plain click on a polygon/line
// jumps straight into `direct_select` (vertex editing). Natively that requires
// two clicks — the first only selects the feature, the second enters editing —
// which feels like a hidden double-click to analysts refining a polygon.
//
// Shift-click (multi-select / box-select) keeps the native behaviour.
// ─────────────────────────────────────────────

const DEBUG = import.meta.env.DEV;
function debugSelect(...args: unknown[]) {
  if (!DEBUG) return;
  console.log('[draw-debug][simple-select]', ...args);
}

const SimpleSelect = (MapboxDraw as any).modes.simple_select;

const SimpleSelectDirectEdit = {
  ...SimpleSelect,

  // Whole-feature move disabled: native simple_select translates the selected
  // feature(s) on drag. We only allow vertex editing (via direct_select), so a
  // press-and-drag on a polygon body must not relocate it. No-op here keeps the
  // selection intact without moving anything.
  dragMove(this: any, _state: any, _e: any): void {
    /* moving the entire geometry is intentionally disabled */
  },

  clickOnFeature(this: any, state: any, e: any) {
    const isShift = !!e?.originalEvent?.shiftKey;
    const featureId = e?.featureTarget?.properties?.id;
    const feature = featureId ? this.getFeature(featureId) : null;
    const isPointLike = feature && (feature.type === 'Point' || feature.type === 'MultiPoint');

    // Plain click on a polygon/line → go straight to vertex editing.
    // Skipped while delete-mode is active, so the click stays a plain
    // selection and draw.selectionchange can drive click-to-delete.
    if (!isShift && feature && !isPointLike && !deleteModeState.active) {
      debugSelect('click → direct_select', { featureId });
      return this.changeMode('direct_select', { featureId });
    }

    return SimpleSelect.clickOnFeature.call(this, state, e);
  },
};

export default SimpleSelectDirectEdit;
