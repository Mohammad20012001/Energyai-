
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
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        }).addTo(mapInstanceRef.current);
    }
    
    const map = mapInstanceRef.current;

    // --- Add Geoman Controls ---
    // Check if controls are already added to prevent duplicates
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
          cutPolygon: true, // Enable the cut tool
          editMode: true,
          dragMode: true,
          removalMode: true,
        });
    }
    
    // Set global options for snapping
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


    // --- Event Listener for when a shape is created ---
    const handleCreate = (e: any) => {
        const { layer } = e;

        // Remove all previously drawn layers to keep only one main shape
        map.eachLayer((l: any) => {
            if (l.pm && (l instanceof L.Polygon || l instanceof L.Rectangle) && l !== layer) {
                l.remove();
            }
        });
        
        recalculateArea(layer);

        // Add listeners to the new layer to update on changes
        layer.on('pm:edit', (editEvent: any) => recalculateArea(editEvent.layer));
        layer.on('pm:cut', (cutEvent: any) => recalculateArea(cutEvent.layer));
    };

    map.on('pm:create', handleCreate);


    // Cleanup function to run when the component unmounts
    return () => {
        map.off('pm:create', handleCreate);
        // Do not remove map instance on cleanup to prevent re-initialization errors
    };
  }, []); // Empty dependency array ensures this effect runs only once

  return <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />;
};

export default LeafletMap;

    