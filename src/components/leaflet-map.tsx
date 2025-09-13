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
  const onAreaCalculatedRef = useRef(onAreaCalculated);

  // Keep the ref updated with the latest callback
  useEffect(() => {
    onAreaCalculatedRef.current = onAreaCalculated;
  }, [onAreaCalculated]);

  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      // Fix for default icon issues with webpack which can happen in Next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current, {
        center: [31.9539, 35.9106], // Centered on Amman, Jordan
        zoom: 13,
      });
      mapInstance.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      map.pm.addControls({
        position: 'topleft',
        drawCircle: false,
        drawMarker: false,
        drawCircleMarker: false,
        drawRectangle: true,
        drawPolyline: false,
        cutPolygon: true,
        editMode: true,
        dragMode: true,
        removalMode: true,
      });

      map.pm.setGlobalOptions({
        limitMarkersToCount: 1,
        snappable: true,
        snapDistance: 20,
      });
      
      const calculateAndCallback = (layer: L.Layer) => {
         if (layer instanceof L.Polygon) {
          const area = L.GeometryUtil.geodesicArea((layer as L.Polygon).getLatLngs()[0] as L.LatLng[]);
          onAreaCalculatedRef.current(area);
        }
      };

      const handleCreate = (e: any) => {
        const { layer } = e;
        
        // Clear previous layers to only have one polygon at a time
        map.eachLayer((l: any) => {
          if (l.pm && l instanceof L.Polygon && l !== layer) {
            l.remove();
          }
        });

        calculateAndCallback(layer);

        layer.on('pm:edit', (editEvent: any) => {
           calculateAndCallback(editEvent.layer);
        });
      };

      map.on('pm:create', handleCreate);
    }
    
    return () => {
      if (mapInstance.current) {
        if ((mapInstance.current as any)._container) {
          mapInstance.current.remove();
        }
        mapInstance.current = null;
      }
    };
  }, []); // Run only once on mount

  return <div ref={mapRef} style={{ height: '100%', width: '100%' }} />;
};

export default LeafletMap;
