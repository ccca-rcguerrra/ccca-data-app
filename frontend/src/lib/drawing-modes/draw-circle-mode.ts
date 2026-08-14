import { circle, distance, point } from '@turf/turf';

const CIRCLE_STEPS = 64;

interface DrawCircleState {
  circle: any;
  center: [number, number] | null;
  hasCircleOnMap: boolean;
}

const DEBUG_DRAW = import.meta.env.DEV;
function debugCircle(...args: unknown[]) {
  if (!DEBUG_DRAW) return;
  console.log('[draw-debug][circle-mode]', ...args);
}

function buildCircleCoords(center: [number, number], radiusKm: number): number[][] {
  const feat = circle(center, radiusKm, { steps: CIRCLE_STEPS, units: 'kilometers' });
  return feat.geometry.coordinates[0];
}

const DrawCircleMode = {
  onSetup(): DrawCircleState {
    debugCircle('onSetup');
    const circleFeature = this.newFeature({
      type: 'Feature',
      properties: {},
      geometry: { type: 'Polygon', coordinates: [[]] },
    });
    this.clearSelectedFeatures();
    this.updateUIClasses({ mouse: 'add' });
    this.setActionableState({ trash: true });
    return { circle: circleFeature, center: null, hasCircleOnMap: false };
  },

  onClick(state: DrawCircleState, e: any) {
    const pt: [number, number] = [e.lngLat.lng, e.lngLat.lat];
    debugCircle('onClick', { pt, hasCenter: !!state.center });

    if (!state.center) {
      state.center = pt;
      if (!state.hasCircleOnMap) {
        this.addFeature(state.circle);
        state.hasCircleOnMap = true;
      }
      // Seed with a minimal circle so the feature is immediately valid in the source
      state.circle.incomingCoords([buildCircleCoords(pt, 0.001)]);
      debugCircle('center set', pt);
      return;
    }

    // Second click — finalize
    debugCircle('finalize circle');
    this.updateUIClasses({ mouse: 'pointer' });
    this.changeMode('simple_select', { featureIds: [state.circle.id] });
  },

  onMouseMove(state: DrawCircleState, e: any) {
    if (!state.center) return;

    const mousePoint: [number, number] = [e.lngLat.lng, e.lngLat.lat];
    const radiusKm = distance(point(state.center), point(mousePoint), { units: 'kilometers' });
    if (radiusKm < 0.001) return;

    state.circle.incomingCoords([buildCircleCoords(state.center, radiusKm)]);
  },

  onKeyUp(state: DrawCircleState, e: any) {
    if (e.keyCode === 27) {
      debugCircle('ESC — cancel');
      this.deleteFeature([state.circle.id]);
      this.changeMode('simple_select');
    }
  },

  onStop(state: DrawCircleState) {
    this.updateUIClasses({ mouse: 'none' });
    this.activateUIButton();
    debugCircle('onStop');

    if (this.getFeature(state.circle.id) === undefined) {
      debugCircle('onStop: feature missing');
      return;
    }

    if (state.circle.isValid()) {
      debugCircle('onStop: fire draw.create');
      this.map.fire('draw.create', { features: [state.circle.toGeoJSON()] });
    } else {
      debugCircle('onStop: invalid circle — delete');
      this.deleteFeature([state.circle.id]);
      this.changeMode('simple_select', {}, { silent: true });
    }
  },

  toDisplayFeatures(state: DrawCircleState, geojson: any, display: (f: any) => void) {
    geojson.properties.active = geojson.properties.id === state.circle.id ? 'true' : 'false';
    display(geojson);
  },
};

export default DrawCircleMode;
