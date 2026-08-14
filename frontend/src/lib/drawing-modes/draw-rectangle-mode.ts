interface DrawState {
  rectangle: any;
  startPoint: [number, number] | null;
  hasRectangleOnMap: boolean;
}

const DEBUG_DRAW = import.meta.env.DEV;

function debugRect(...args: unknown[]) {
  if (!DEBUG_DRAW) return;
  console.log('[draw-debug][rectangle-mode]', ...args);
}

const DrawRectangleMode = {
  onSetup(): DrawState {
    debugRect('onSetup');
    const rectangle = this.newFeature({
      type: 'Feature',
      properties: {},
      geometry: { type: 'Polygon', coordinates: [[]] },
    });
    this.clearSelectedFeatures();
    this.updateUIClasses({ mouse: 'add' });
    this.setActionableState({ trash: true });
    return { rectangle, startPoint: null, hasRectangleOnMap: false };
  },

  onClick(state: DrawState, e: any) {
    const point: [number, number] = [e.lngLat.lng, e.lngLat.lat];
    debugRect('onClick', { point, hasStartPoint: !!state.startPoint });

    if (!state.startPoint) {
      state.startPoint = point;
      if (!state.hasRectangleOnMap) {
        this.addFeature(state.rectangle);
        state.hasRectangleOnMap = true;
      }
      // Initialize a valid closed ring immediately to avoid invalid GeoJSON in render source.
      state.rectangle.updateCoordinate('0.0', point[0], point[1]);
      state.rectangle.updateCoordinate('0.1', point[0], point[1]);
      state.rectangle.updateCoordinate('0.2', point[0], point[1]);
      state.rectangle.updateCoordinate('0.3', point[0], point[1]);
      state.rectangle.updateCoordinate('0.4', point[0], point[1]);
      debugRect('first-click:init-rectangle');
      return;
    }

    // Second click — ensure the rectangle is updated to the final clicked point
    // even when there was no mousemove between clicks.
    const [lng0, lat0] = state.startPoint;
    const [lng1, lat1] = point;
    state.rectangle.updateCoordinate('0.0', lng0, lat0);
    state.rectangle.updateCoordinate('0.1', lng1, lat0);
    state.rectangle.updateCoordinate('0.2', lng1, lat1);
    state.rectangle.updateCoordinate('0.3', lng0, lat1);
    state.rectangle.updateCoordinate('0.4', lng0, lat0);
    debugRect('second-click:finalize', { startPoint: state.startPoint, endPoint: point });

    // Finalize
    this.updateUIClasses({ mouse: 'pointer' });
    this.changeMode('simple_select', { featureIds: [state.rectangle.id] });
  },

  onMouseMove(state: DrawState, e: any) {
    if (!state.startPoint) return;

    const [lng0, lat0] = state.startPoint;
    const lng1 = e.lngLat.lng;
    const lat1 = e.lngLat.lat;

    state.rectangle.updateCoordinate('0.0', lng0, lat0);
    state.rectangle.updateCoordinate('0.1', lng1, lat0);
    state.rectangle.updateCoordinate('0.2', lng1, lat1);
    state.rectangle.updateCoordinate('0.3', lng0, lat1);
    state.rectangle.updateCoordinate('0.4', lng0, lat0);
    // Keep mousemove logs disabled to avoid flooding and hiding transition logs.
  },

  onKeyUp(state: DrawState, e: any) {
    if (e.keyCode === 27) {
      this.deleteFeature([state.rectangle.id]);
      this.changeMode('simple_select');
    }
  },

  onStop(state: DrawState) {
    this.updateUIClasses({ mouse: 'none' });
    this.activateUIButton();
    debugRect('onStop:start');

    if (this.getFeature(state.rectangle.id) === undefined) {
      debugRect('onStop:feature-missing');
      return;
    }

    state.rectangle.removeCoordinate('0.4');
    if (state.rectangle.isValid()) {
      debugRect('onStop:fire-draw-create');
      this.map.fire('draw.create', { features: [state.rectangle.toGeoJSON()] });
    } else {
      debugRect('onStop:invalid-rectangle-delete');
      this.deleteFeature([state.rectangle.id]);
      this.changeMode('simple_select', {}, { silent: true });
    }
  },

  toDisplayFeatures(state: DrawState, geojson: any, display: (f: any) => void) {
    geojson.properties.active = geojson.properties.id === state.rectangle.id ? 'true' : 'false';
    display(geojson);
  },
};

export default DrawRectangleMode;
