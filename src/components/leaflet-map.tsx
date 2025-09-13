
'use client';

import { useEffect } from 'react';
import { useMap, MapContainer, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';

interface DrawingManagerProps {
  onAreaCalculated: (area: number) => void;
}

const DrawingManager = ({ onAreaCalculated }: DrawingManagerProps) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // Add Geoman controls
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
        map.off('pm:create', handleCreate);
      }
    };
  }, [map, onAreaCalculated]);

  return null;
};


interface LeafletMapProps {
  onAreaCalculated: (area: number) => void;
}

const LeafletMap = ({ onAreaCalculated }: LeafletMapProps) => {
  // Fix for default icon issues with webpack which can happen in Next.js
   useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }, []);

  return (
    <MapContainer
      center={[31.9539, 35.9106]} // Centered on Amman, Jordan
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <DrawingManager onAreaCalculated={onAreaCalculated} />
    </MapContainer>
  );
};

export default LeafletMap;
