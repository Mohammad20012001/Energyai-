'use client';

import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';

interface LeafletMapProps {
  onAreaCalculated: (area: number) => void;
}

const DrawingManager = ({ onAreaCalculated }: LeafletMapProps) => {
  const map = useMap();

  useEffect(() => {
    // Fix for default icon issues with webpack
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    if (!map) return;

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

    // Event listener for when a new shape is created
    map.on('pm:create', (e) => {
      const { layer } = e;
      
      // Clear previous layers
      map.eachLayer((l) => {
          if (l instanceof L.Polygon && l !== layer) {
              l.remove();
          }
      });
      
      if (layer instanceof L.Polygon) {
        const geojson = layer.toGeoJSON();
        const area = L.GeometryUtil.geodesicArea(layer.getLatLngs()[0] as L.LatLng[]);
        onAreaCalculated(area);
      }

      layer.on('pm:edit', (editEvent) => {
          if (editEvent.layer instanceof L.Polygon) {
             const area = L.GeometryUtil.geodesicArea(editEvent.layer.getLatLngs()[0] as L.LatLng[]);
             onAreaCalculated(area);
          }
      });

    });

    return () => {
      map.pm.removeControls();
      map.off('pm:create');
    };
  }, [map, onAreaCalculated]);

  return null;
};

const LeafletMap = ({ onAreaCalculated }: LeafletMapProps) => {
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
