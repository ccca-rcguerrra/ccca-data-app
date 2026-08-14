function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function ringToKmlCoordinates(ring: number[][]): string {
  return ring.map(([lng, lat]) => `${lng},${lat},0`).join(' ');
}

function polygonCoordinatesToKml(polygon: number[][][]): string {
  const [outer, ...holes] = polygon;
  if (!outer?.length) return '';

  let kml = `<outerBoundaryIs><LinearRing><coordinates>${ringToKmlCoordinates(outer)}</coordinates></LinearRing></outerBoundaryIs>`;

  for (const hole of holes) {
    if (!hole?.length) continue;
    kml += `<innerBoundaryIs><LinearRing><coordinates>${ringToKmlCoordinates(hole)}</coordinates></LinearRing></innerBoundaryIs>`;
  }

  return `<Polygon>${kml}</Polygon>`;
}

function geometryToKmlFragment(geometry: GeoJSON.Geometry): string {
  switch (geometry.type) {
    case 'Polygon':
      return polygonCoordinatesToKml(geometry.coordinates);
    case 'MultiPolygon':
      return `<MultiGeometry>${geometry.coordinates
        .map((polygon) => polygonCoordinatesToKml(polygon))
        .join('')}</MultiGeometry>`;
    case 'Point': {
      const [lng, lat] = geometry.coordinates;
      return `<Point><coordinates>${lng},${lat},0</coordinates></Point>`;
    }
    case 'LineString':
      return `<LineString><coordinates>${ringToKmlCoordinates(geometry.coordinates)}</coordinates></LineString>`;
    case 'MultiLineString':
      return `<MultiGeometry>${geometry.coordinates
        .map(
          (line) =>
            `<LineString><coordinates>${ringToKmlCoordinates(line)}</coordinates></LineString>`
        )
        .join('')}</MultiGeometry>`;
    case 'MultiPoint':
      return `<MultiGeometry>${geometry.coordinates
        .map(([lng, lat]) => `<Point><coordinates>${lng},${lat},0</coordinates></Point>`)
        .join('')}</MultiGeometry>`;
    case 'GeometryCollection':
      return `<MultiGeometry>${geometry.geometries
        .map((geom) => geometryToKmlFragment(geom))
        .join('')}</MultiGeometry>`;
    default:
      return '';
  }
}

export interface GeometryKmlOptions {
  name: string;
  description?: string;
}

/** Builds a KML document for a GeoJSON geometry. */
export function buildGeometryKml(
  geometry: GeoJSON.Geometry,
  options: GeometryKmlOptions,
): string {
  const geometryKml = geometryToKmlFragment(geometry);
  const name = escapeXml(options.name);
  const description = options.description ? escapeXml(options.description) : '';

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${name}</name>
    <Placemark>
      <name>${name}</name>${description ? `\n      <description>${description}</description>` : ''}
      ${geometryKml}
    </Placemark>
  </Document>
</kml>`;
}

export function buildAlertKmlFilename(alertId: number, alertCode?: number | null): string {
  const codeSuffix = alertCode != null ? `-${alertCode}` : '';
  return `alert-${alertId}${codeSuffix}.kml`;
}

/** Triggers a browser download for KML content. */
export function downloadKml(content: string, filename: string): void {
  const blob = new Blob([content], {
    type: 'application/vnd.google-earth.kml+xml;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
