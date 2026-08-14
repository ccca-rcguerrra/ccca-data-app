import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useMap } from './map';
import type { DrawingControlsProps, DrawingControlsRef } from './types';
import { createExtendedDraw } from '@/lib/drawing-modes/mapbox-draw-extended';
import type { ExtendedMapboxDraw } from '@/lib/drawing-modes/mapbox-draw-extended';
import 'maplibre-gl-draw/dist/mapbox-gl-draw.css';

const DEBUG_DRAW = import.meta.env.DEV;
function debugDraw(...args: unknown[]) {
  if (!DEBUG_DRAW) return;
  console.log('[draw-debug]', ...args);
}

type DrawingControlsComponentProps = DrawingControlsProps & {
  continuousDraw?: boolean;
};

export const DrawingControls = forwardRef<DrawingControlsRef, DrawingControlsComponentProps>(
  (
    {
      onFeatureCreate,
      onFeatureUpdate,
      onFeatureDelete,
      onGeometriesChange,
      defaultMode = 'draw_polygon',
      drawTarget,
      clearTrigger,
      editMode = false,
      enabled = false,
      continuousDraw = true,
      maxFeatures,
    },
    ref
  ) => {
    const { map, isMapLoaded } = useMap();
    const drawRef = useRef<ExtendedMapboxDraw | null>(null);
    const isControlAddedRef = useRef(false);

    // Stable callback refs — synced to props each render without re-registering events
    const onFeatureCreateRef = useRef(onFeatureCreate);
    const onFeatureUpdateRef = useRef(onFeatureUpdate);
    const onFeatureDeleteRef = useRef(onFeatureDelete);
    const onGeometriesChangeRef = useRef(onGeometriesChange);
    useEffect(() => { onFeatureCreateRef.current = onFeatureCreate; }, [onFeatureCreate]);
    useEffect(() => { onFeatureUpdateRef.current = onFeatureUpdate; }, [onFeatureUpdate]);
    useEffect(() => { onFeatureDeleteRef.current = onFeatureDelete; }, [onFeatureDelete]);
    useEffect(() => { onGeometriesChangeRef.current = onGeometriesChange; }, [onGeometriesChange]);

    // Keep ExtendedDraw callbacks in sync with React props.
    // The draw instance reads from this.callbacks on each event, so no re-registration needed.
    useEffect(() => {
      drawRef.current?.setCallbacks({
        onFeatureCreate: (f) => onFeatureCreateRef.current?.(f),
        onFeatureUpdate: (f) => onFeatureUpdateRef.current?.(f),
        onFeatureDelete: () => onFeatureDeleteRef.current?.(),
        onGeometriesChange: (d) => onGeometriesChangeRef.current?.(d),
      });
    }, [onFeatureCreate, onFeatureUpdate, onFeatureDelete, onGeometriesChange]);

    // Keep continuous draw setting in sync
    useEffect(() => {
      drawRef.current?.setContinuousDraw(continuousDraw);
    }, [continuousDraw]);

    // Keep maxFeatures in sync
    useEffect(() => {
      drawRef.current?.setMaxFeatures(maxFeatures);
    }, [maxFeatures]);

    const addControl = () => {
      const draw = drawRef.current;
      if (!draw || !map || isControlAddedRef.current) return false;
      try {
        map.addControl(draw as any, 'top-right');
        isControlAddedRef.current = true;
        debugDraw('control:add');
        return true;
      } catch (error) {
        console.error('Error adding draw control:', error);
        return false;
      }
    };

    const removeControl = () => {
      const draw = drawRef.current;
      if (!draw || !map || !isControlAddedRef.current) return;
      try {
        map.removeControl(draw as any);
        isControlAddedRef.current = false;
        debugDraw('control:remove');
      } catch (error) {
        console.warn('Error removing draw control:', error);
      }
    };

    // ─── Imperative handle ────────────────────────────────────────────────

    useImperativeHandle(ref, () => ({
      setGeometry: (geometry: GeoJSON.FeatureCollection) => {
        if (!drawRef.current || !map) return;
        debugDraw('imperative:setGeometry', { features: geometry?.features?.length ?? 0 });
        addControl();
        drawRef.current.setGeometry(geometry);
      },

      clearGeometry: () => {
        if (!drawRef.current || !isControlAddedRef.current) return;
        debugDraw('imperative:clearGeometry');
        try { drawRef.current.deleteAll(); } catch (error) { console.warn('Error clearing geometry:', error); }
      },

      getGeometry: () => {
        if (!drawRef.current || !isControlAddedRef.current) {
          return { type: 'FeatureCollection' as const, features: [] };
        }
        debugDraw('imperative:getGeometry');
        try { return drawRef.current.getAll(); } catch {
          return { type: 'FeatureCollection' as const, features: [] };
        }
      },

      changeMode: (mode: 'draw_polygon' | 'draw_rectangle' | 'draw_circle' | 'simple_select' | 'direct_select') => {
        debugDraw('imperative:changeMode', { mode });
        addControl();
        drawRef.current?.changeMode(mode);
      },

      finalizeDrawing: () => {
        if (!drawRef.current || !isControlAddedRef.current) return;
        debugDraw('imperative:finalizeDrawing');
        drawRef.current.finalizeDrawing();
      },
    }));

    // ─── Init: create once per map load ───────────────────────────────────

    useEffect(() => {
      if (!map || !isMapLoaded || drawRef.current) return;

      const draw = createExtendedDraw({
        displayControlsDefault: false,
        controls: {},
        defaultMode: defaultMode as any,
        continuousDraw,
      });

      // Wire callbacks via stable ref wrappers
      draw.setCallbacks({
        onFeatureCreate: (f) => onFeatureCreateRef.current?.(f),
        onFeatureUpdate: (f) => onFeatureUpdateRef.current?.(f),
        onFeatureDelete: () => onFeatureDeleteRef.current?.(),
        onGeometriesChange: (d) => onGeometriesChangeRef.current?.(d),
      });

      drawRef.current = draw;
      debugDraw('draw:init', { defaultMode, continuousDraw });

      return () => {
        if (drawRef.current && map) {
          removeControl();
          drawRef.current.destroy();
          drawRef.current = null;
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, isMapLoaded]);

    // ─── Add/remove based on enabled ──────────────────────────────────────

    useEffect(() => {
      if (!map || !drawRef.current) return;

      if (enabled) {
        debugDraw('enabled:true');
        addControl();
      } else {
        debugDraw('enabled:false');
        if (isControlAddedRef.current) {
          try {
            const data = drawRef.current.getAll();
            onGeometriesChangeRef.current?.(data);
          } catch (error) {
            console.warn('Error syncing geometries before disabling draw control:', error);
          }
          removeControl();
        }
      }
    }, [map, enabled]);

    // ─── Load drawTarget ──────────────────────────────────────────────────

    useEffect(() => {
      if (!map || !drawRef.current || !drawTarget || !isControlAddedRef.current) return;
      const draw = drawRef.current;
      try {
        draw.deleteAll();
        if (drawTarget.type === 'FeatureCollection') draw.add(drawTarget);
        if (editMode) draw.changeMode('simple_select');
      } catch (error) {
        console.error('Error loading target geometry:', error);
      }
    }, [map, drawTarget, editMode]);

    // ─── clearTrigger ─────────────────────────────────────────────────────

    useEffect(() => {
      if (!drawRef.current || !isControlAddedRef.current || clearTrigger === undefined) return;
      try {
        drawRef.current.deleteAll();
        drawRef.current.changeMode(defaultMode);
      } catch (error) {
        console.warn('Error clearing on trigger:', error);
      }
    }, [clearTrigger, defaultMode]);

    return null;
  }
);

DrawingControls.displayName = 'DrawingControls';
