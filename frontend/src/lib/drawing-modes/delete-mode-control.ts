import type { ExtendedDrawCallbacks } from './mapbox-draw-extended';
import { deleteModeState } from './delete-mode-state';

const DEBUG = import.meta.env.DEV;
function debugDelete(...args: unknown[]) {
  if (!DEBUG) return;
  console.log('[draw-debug][delete]', ...args);
}

// ─────────────────────────────────────────────
// Host contract
//
// DeleteModeControl drives delete behaviour through this minimal surface,
// which ExtendedMapboxDraw already satisfies with its public API.
// ─────────────────────────────────────────────

export interface DeleteModeHost {
  getAll(): GeoJSON.FeatureCollection;
  add(geojson: GeoJSON.Feature | GeoJSON.FeatureCollection): unknown;
  delete(ids: string | string[]): unknown;
  deleteAll(): unknown;
  getMode(): string;
  changeMode(mode: string): unknown;
  readonly callbacks: ExtendedDrawCallbacks;
}

// ─────────────────────────────────────────────
// Styles (injected once)
// ─────────────────────────────────────────────

let deleteBarStylesInjected = false;

function injectDeleteBarStyles(): void {
  if (deleteBarStylesInjected) return;
  deleteBarStylesInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    .draw-delete-bar {
      display: flex !important;
      flex-direction: row !important;
      margin-top: 4px;
      pointer-events: auto;
    }
    .draw-delete-bar button {
      width: auto !important;
      height: 28px !important;
      padding: 0 8px !important;
      font-size: 11px !important;
      font-weight: 600 !important;
      background: none !important;
      cursor: pointer;
      white-space: nowrap;
    }
    .draw-delete-bar button:hover { opacity: 0.75; }
    .draw-delete-bar__save  { color: #1976d2; }
    .draw-delete-bar__cancel { color: #555; }
    .draw-delete-bar__clear  { color: #c62828; }
    .mapbox-gl-draw_trash.draw-delete-active {
      background-color: rgba(200, 0, 0, 0.12) !important;
    }
  `;
  document.head.appendChild(style);
}

// ─────────────────────────────────────────────
// DeleteModeControl
//
// Owns the custom trash button and the whole delete-mode flow:
//   - injecting the trash button into the toolbar
//   - entering/exiting delete mode (with snapshot + restore on cancel)
//   - click-to-delete via draw.selectionchange
//   - the Save / Cancel / Clear All action bar
// ─────────────────────────────────────────────

export class DeleteModeControl {
  private readonly host: DeleteModeHost;
  private map: any | null = null;

  private isDeleteMode = false;
  private snapshotBeforeDelete: GeoJSON.Feature[] = [];
  private deleteBarEl: HTMLElement | null = null;
  private trashBtnEl: HTMLButtonElement | null = null;

  // Stable bound handler — same reference required for map.on / map.off
  private readonly boundHandleDeleteSelection: (e: any) => void;

  constructor(host: DeleteModeHost) {
    this.host = host;
    this.boundHandleDeleteSelection = this.handleDeleteSelection.bind(this);
  }

  /**
   * Injects a fully custom trash button (the native MapboxDraw trash control
   * is disabled). Mirrors the rectangle / circle buttons.
   * - In a draw mode: cancels the current drawing.
   * - Otherwise: toggles delete mode (enter/exit-cancel).
   */
  inject(map: any, container: HTMLElement): void {
    this.map = map;
    injectDeleteBarStyles();

    const circleBtn = container.querySelector('.mapbox-gl-draw_circle');
    const rectangleBtn = container.querySelector('.mapbox-gl-draw_rectangle');
    const referenceBtn = circleBtn ?? rectangleBtn ?? container.querySelector('.mapbox-gl-draw_polygon');
    if (!referenceBtn) return;

    const btn = document.createElement('button');
    btn.className = 'mapbox-gl-draw_ctrl-draw-btn mapbox-gl-draw_trash';
    btn.type = 'button';
    btn.title = 'Delete';
    btn.addEventListener('click', () => this.handleTrashClick(container));
    referenceBtn.insertAdjacentElement('afterend', btn);
    this.trashBtnEl = btn;
  }

  /**
   * Notified by the host on every mode change. Picking another tool (any mode
   * other than the simple_select baseline delete mode runs in) commits the
   * deletions and leaves delete mode, so the trash button and the action bar
   * stay in sync with the rest of the toolbar.
   */
  handleHostModeChange(mode: string | null | undefined): void {
    if (!this.isDeleteMode) return;
    if (mode && mode !== 'simple_select') {
      this.exitDeleteMode(true);
    }
  }

  /** Tear down delete-mode state, listeners and the action bar. */
  destroy(): void {
    if (this.isDeleteMode) this.exitDeleteMode(false);
    this.hideDeleteBar();
    this.map = null;
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  private handleTrashClick(container: HTMLElement): void {
    // Always a single-click toggle. Entering from a draw mode is handled by
    // enterDeleteMode's switch to simple_select, which also discards any
    // in-progress drawing — so no separate "cancel draw" click is needed.
    if (this.isDeleteMode) {
      this.exitDeleteMode(false);
    } else {
      this.enterDeleteMode(container);
    }
  }

  private enterDeleteMode(container: HTMLElement): void {
    // Switch first: this cancels any in-progress draw and deactivates the draw
    // button, so the snapshot reflects only committed geometries.
    this.host.changeMode('simple_select');
    this.snapshotBeforeDelete = JSON.parse(JSON.stringify(this.host.getAll().features));
    this.isDeleteMode = true;
    deleteModeState.active = true;
    this.map?.on('draw.selectionchange', this.boundHandleDeleteSelection);
    if (this.trashBtnEl) this.trashBtnEl.classList.add('draw-delete-active');
    this.showDeleteBar(container);
    debugDelete('delete-mode:enter');
  }

  private exitDeleteMode(save: boolean): void {
    this.isDeleteMode = false;
    deleteModeState.active = false;
    this.map?.off('draw.selectionchange', this.boundHandleDeleteSelection);
    if (this.trashBtnEl) this.trashBtnEl.classList.remove('draw-delete-active');
    this.hideDeleteBar();

    if (!save) {
      this.host.deleteAll();
      for (const f of this.snapshotBeforeDelete) {
        try { this.host.add(f); } catch { }
      }
    }

    this.host.callbacks.onGeometriesChange?.(this.host.getAll());
    this.snapshotBeforeDelete = [];
    debugDelete('delete-mode:exit', { saved: save });
  }

  private handleDeleteSelection(e: any): void {
    if (!this.isDeleteMode || !e.features?.length) return;
    const ids: string[] = e.features.map((f: any) => f.id).filter(Boolean);
    if (!ids.length) return;
    this.host.delete(ids);
    this.host.callbacks.onGeometriesChange?.(this.host.getAll());
    debugDelete('delete-mode:deleted', { ids });
  }

  private showDeleteBar(container: HTMLElement): void {
    if (this.deleteBarEl) return;

    const bar = document.createElement('div');
    bar.className = 'draw-delete-bar maplibregl-ctrl maplibregl-ctrl-group';

    const make = (label: string, cls: string, onClick: () => void) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = label;
      btn.className = `draw-delete-bar__btn ${cls}`;
      btn.addEventListener('click', onClick);
      bar.appendChild(btn);
    };

    make('Save',      'draw-delete-bar__save',   () => this.exitDeleteMode(true));
    make('Cancel',    'draw-delete-bar__cancel',  () => this.exitDeleteMode(false));
    make('Clear All', 'draw-delete-bar__clear',   () => {
      // Clears the map but stays in delete mode: Save commits the cleared
      // state, Cancel restores the snapshot taken on enter.
      this.host.deleteAll();
      this.host.callbacks.onGeometriesChange?.(this.host.getAll());
      debugDelete('delete-mode:clear-all');
    });

    container.parentNode?.insertBefore(bar, container.nextSibling);
    this.deleteBarEl = bar;
  }

  private hideDeleteBar(): void {
    this.deleteBarEl?.remove();
    this.deleteBarEl = null;
  }
}
