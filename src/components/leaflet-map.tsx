'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';

interface DrawingManagerProps {
  onAreaCalculated: (area: number) => void;
}

const LeafletMap = ({ onAreaCalculated }: DrawingManagerProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    // Check if the map container is available and if the map is NOT already initialized
    if (mapRef.current && !mapInstance.current) {
      // Fix for default icon issues with webpack which can happen in Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      // Initialize the map and store the instance
      mapInstance.current = L.map(mapRef.current, {
        center: [31.9539, 35.9106], // Centered on Amman, Jordan
        zoom: 13,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapInstance.current);

      const map = mapInstance.current;

      // Adds the drawing controls to the map
      map.pm.addControls({
        position: 'topleft',
        drawCircle: false,
        drawMarker: false,
        drawCircleMarker: false,
        drawRectangle: true,
        drawPolyline: false,
        cutPolygon: false,
        editMode: true,
        dragMode: true,
        removalMode: true,
      });

      map.pm.setGlobalOptions({
        limitMarkersToCount: 1,
        snappable: true,
        snapDistance: 20,
      });
      
      const handleCreate = (e: any) => {
        const { layer } = e;

        // Clear previous layers to only have one polygon at a time
        map.eachLayer((l: any) => {
          if (l.pm && l instanceof L.Polygon && l !== layer) {
            l.remove();
          }
        });

        if (layer instanceof L.Polygon) {
          const area = L.GeometryUtil.geodesicArea(layer.getLatLngs()[0] as L.LatLng[]);
          onAreaCalculated(area);
        }

        layer.on('pm:edit', (editEvent: any) => {
          if (editEvent.layer instanceof L.Polygon) {
            const area = L.GeometryUtil.geodesicArea(editEvent.layer.getLatLngs()[0] as L.LatLng[]);
            onAreaCalculated(area);
          }
        });
      };

      map.on('pm:create', handleCreate);
    }
    
    // Cleanup function to run when the component unmounts
    return () => {
      if (mapInstance.current) {
        // This check is to see if the container is still there. If not, Leaflet will throw an error.
        if ((mapInstance.current as any)._container) {
          mapInstance.current.remove();
        }
        mapInstance.current = null;
      }
    };
  }, [onAreaCalculated]);

  return <div ref={mapRef} style={{ height: '100%', width: '100%' }} />;
};

export default LeafletMap;
