
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
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mapInstanceRef.current);
    }
    
    const map = mapInstanceRef.current;

    // --- Add Geoman Controls ---
    // Check if controls are already added to prevent duplicates
    if (!map.pm.controlsVisible()) {
        map.pm.addControls({
          position: 'topleft',
          drawCircle: false,
          drawMarker: false,
          drawCircleMarker: false,
          drawRectangle: true,
          drawPolyline: false,
          drawPolygon: true,
          cutPolygon: false,
          editMode: true,
          dragMode: true,
          removalMode: true,
        });
    }
    
    // Set global options for snapping
    map.pm.setGlobalOptions({
        snappable: true,
        snapDistance: 20,
    });


    // --- Event Listener for when a shape is created ---
    const handleCreate = (e: any) => {
        const { layer } = e;

        // Remove all previously drawn layers to keep only one
        map.eachLayer((l: any) => {
            if (l.pm && (l instanceof L.Polygon || l instanceof L.Rectangle) && l !== layer) {
                l.remove();
            }
        });

        // Calculate the area of the newly created shape
        if (layer instanceof L.Polygon) {
             const area = L.PM.Utils.getGeodesicArea(layer.getLatLngs()[0] as L.LatLng[]);
             onAreaCalculatedRef.current(area);
        }

        // Add an edit listener to the new layer to update on changes
        layer.on('pm:edit', (editEvent: any) => {
           if (editEvent.layer instanceof L.Polygon) {
                const area = L.PM.Utils.getGeodesicArea(editEvent.layer.getLatLngs()[0] as L.LatLng[]);
                onAreaCalculatedRef.current(area);
           }
        });
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
