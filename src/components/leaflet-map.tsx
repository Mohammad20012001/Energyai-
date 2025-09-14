
'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';

// Monkey patch the Leaflet Default Icon to fix loading issues
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Local implementation of geodesicArea to avoid import issues.
// Source: https://github.com/Leaflet/Leaflet.GeometryUtil/blob/master/src/L.GeometryUtil.js
// This version handles polygons with holes.
function calculateGeodesicArea(latlngs: L.LatLng[] | L.LatLng[][] | L.LatLng[][][]): number {
    const d2r = Math.PI / 180;
    let area = 0.0;

    const processRing = (ring: L.LatLng[]) => {
        let ringArea = 0.0;
        if (ring.length > 2) {
            for (let i = 0; i < ring.length; i++) {
                const p1 = ring[i];
                const p2 = ring[(i + 1) % ring.length];
                ringArea += ((p2.lng - p1.lng) * d2r) *
                    (2 + Math.sin(p1.lat * d2r) + Math.sin(p2.lat * d2r));
            }
        }
        return ringArea * 6378137.0 * 6378137.0 / 2.0;
    };

    if (Array.isArray(latlngs) && latlngs.length > 0) {
        if (Array.isArray(latlngs[0]) && latlngs[0].length > 0 && latlngs[0][0] instanceof L.LatLng) {
            // It's a polygon with holes: L.LatLng[][]
            const mainRingArea = processRing(latlngs[0] as L.LatLng[]);
            let holeArea = 0.0;
            for (let i = 1; i < latlngs.length; i++) {
                holeArea += processRing(latlngs[i] as L.LatLng[]);
            }
            area = Math.abs(mainRingArea - holeArea);
        } else if (latlngs[0] instanceof L.LatLng) {
            // It's a simple polygon: L.LatLng[]
            area = Math.abs(processRing(latlngs as L.LatLng[]));
        }
    }

    return area;
}


interface LeafletMapProps {
  onAreaCalculated: (area: number) => void;
}

const LeafletMap = ({ onAreaCalculated }: LeafletMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const onAreaCalculatedRef = useRef(onAreaCalculated);

  // Keep the ref updated with the latest callback function
  useEffect(() => {
    onAreaCalculatedRef.current = onAreaCalculated;
  }, [onAreaCalculated]);

  useEffect(() => {
    // Ensure this runs only on the client and that the container exists
    if (typeof window === 'undefined' || !mapContainerRef.current) {
      return;
    }

    // Initialize the map only if it hasn't been initialized yet
    if (!mapInstanceRef.current) {
        mapInstanceRef.current = L.map(mapContainerRef.current).setView([31.9539, 35.9106], 13);
        
        // --- Define Base Layers ---
        const streetLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            maxZoom: 19
        });

        const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, & the GIS User Community'
        });
        
        const darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            maxZoom: 19
        });

        // --- Define Overlay Layer for Labels ---
        const labelsLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>',
            pane: 'shadowPane' // Ensures labels appear on top of other layers
        });
        
        streetLayer.addTo(mapInstanceRef.current); // Set default layer
        labelsLayer.addTo(mapInstanceRef.current); // Show labels by default

        // --- Create Layer Control ---
        const baseMaps = {
            "شوارع": streetLayer,
            "قمر صناعي": satelliteLayer,
            "مظلم": darkLayer
        };

        const overlayMaps = {
            "إظهار التقسيمات": labelsLayer
        };

        L.control.layers(baseMaps, overlayMaps).addTo(mapInstanceRef.current);
    }
    
    const map = mapInstanceRef.current;

    // --- Add Geoman Controls ---
    if (!(map as any).pm) {
      console.error("Leaflet-Geoman not initialized on map instance.");
      return;
    }
    
    if (!(map as any).pm.controlsVisible()) {
        (map as any).pm.addControls({
          position: 'topleft',
          drawCircle: false,
          drawMarker: false,
          drawCircleMarker: false,
          drawRectangle: true,
          drawPolyline: false,
          drawPolygon: true,
          cutPolygon: true,
          editMode: true,
          dragMode: true,
          removalMode: true,
        });
    }
    
    (map as any).pm.setGlobalOptions({
        snappable: true,
        snapDistance: 20,
    });
    
    const recalculateArea = (layer: L.Polygon | L.Rectangle) => {
        if (layer instanceof L.Polygon) {
             const area = calculateGeodesicArea(layer.getLatLngs());
             onAreaCalculatedRef.current(area);
        }
    };

    const handleCreate = (e: any) => {
        const { layer } = e;

        map.eachLayer((l: any) => {
            if (l.pm && (l instanceof L.Polygon || l instanceof L.Rectangle) && l !== layer) {
                l.remove();
            }
        });
        
        recalculateArea(layer);

        layer.on('pm:edit', (editEvent: any) => recalculateArea(editEvent.layer));
        layer.on('pm:cut', (cutEvent: any) => recalculateArea(cutEvent.layer));
    };

    map.on('pm:create', handleCreate);


    // Cleanup function
    return () => {
        map.off('pm:create', handleCreate);
    };
  }, []); 

  return <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />;
};

export default LeafletMap;
