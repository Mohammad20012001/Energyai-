
'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';

interface DrawingManagerProps {
  onAreaCalculated: (area: number) => void;
}

const DrawingManager = ({ onAreaCalculated }: DrawingManagerProps) => {
  const map = useMap();

  useEffect(() => {
    // Fix for default icon issues with webpack which can happen in Next.js
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    if (!map) return;

    // Initialize Geoman controls
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
        snappable: true,
        snapDistance: 20,
    });

    const calculateAndCallback = (layer: L.Layer) => {
      if (layer instanceof L.Polygon) {
        const area = L.GeometryUtil.geodesicArea((layer as L.Polygon).getLatLngs()[0] as L.LatLng[]);
        onAreaCalculated(area);
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

    // Cleanup function
    return () => {
      if (map.pm) {
        map.pm.removeControls();
        map.off('pm:create', handleCreate);
      }
    };
  }, [map, onAreaCalculated]);

  return null; // This component does not render anything itself
};

export default DrawingManager;
