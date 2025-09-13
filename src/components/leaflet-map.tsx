'use client';

import { useMap, MapContainer, TileLayer } from 'react-leaflet';
import { useEffect } from 'react';
import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';

interface DrawingManagerProps {
  onAreaCalculated: (area: number) => void;
}

const DrawingManager = ({ onAreaCalculated }: DrawingManagerProps) => {
  const map = useMap();

  useEffect(() => {
    if (!map.pm) return;

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
      
      // Clear previous layers
      map.eachLayer((l: any) => {
          if (l.pm && l instanceof L.Polygon && l !== layer) {
              l.remove();
          }
      });
      
      if (layer instanceof L.Polygon) {
        const geojson = layer.toGeoJSON();
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

    return () => {
      map.off('pm:create', handleCreate);
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
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <DrawingManager onAreaCalculated={onAreaCalculated} />
    </MapContainer>
  );
};

export default LeafletMap;
