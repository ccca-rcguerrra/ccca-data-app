export const BaseMaps = {
    GOOGLE: {
        Maps: {
            url: 'https://mt1.google.com/vt/lyrs=r&x={x}&y={y}&z={z}',
            attribution: 'Google Maps',
        },
        Satellite: {
            url: 'https://mt1.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}',
            attribution: ' Google Satellite',
        },
        SatelliteHybrid: {
            url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
            attribution: 'Google Satellite Hybrid',

        },
        Terrain: {
            url: 'https://mt1.google.com/vt/lyrs=t&x={x}&y={y}&z={z}',
            attribution: 'Google Terrain',
        },
        Roads: {
            url: 'https://mt1.google.com/vt/lyrs=h&x={x}&y={y}&z={z}',
            attribution: 'Google Roads',
        }
    },

    OSM: {
        Standard: {
            url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            attribution: 'Open Street Maps',
        },
        /** Carto Dark Matter — OSM-based dark tiles for the app dark theme. */
        Dark: {
            url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            attribution: '© OpenStreetMap © CARTO',
        },
        Monochrome: {
            url: 'http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png',
            attribution: 'Open Street Maps',
        }
    }
} as const;

/** OSM basemap variant matching the current app theme. */
export function getOsmBasemap(theme: 'light' | 'dark') {
    return theme === 'dark' ? BaseMaps.OSM.Dark : BaseMaps.OSM.Standard;
}
