
'use client';

import { MapContainer, TileLayer } from "react-leaflet";
import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import { useEffect } from 'react';
import { useMap } from "react-leaflet";

// Monkey patch the Leaflet Default Icon
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});


interface DrawingManagerProps {
  onAreaCalculated: (area: number) => void;
}

const DrawingManager = ({ onAreaCalculated }: DrawingManagerProps) => {
  const map = useMap();

  useEffect(() => {
    // Add drawing controls
    map.pm.addControls({
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
             const area = L.GeometryUtil.geodesicArea((layer as L.Polygon).getLatLngs()[0] as L.LatLng[]);
             onAreaCalculated(area);
        }

        // Add an edit listener to the new layer to update on changes
        layer.on('pm:edit', (editEvent: any) => {
           if (editEvent.layer instanceof L.Polygon) {
                const area = L.GeometryUtil.geodesicArea((editEvent.layer as L.Polygon).getLatLngs()[0] as L.LatLng[]);
                onAreaCalculated(area);
           }
        });
    };

    map.on('pm:create', handleCreate);

    // Cleanup: remove controls and event listeners when the component unmounts
    return () => {
      map.pm.removeControls();
      map.off('pm:create', handleCreate);
    };

  }, [map, onAreaCalculated]);

  return null;
};


interface LeafletMapProps {
  onAreaCalculated: (area: number) => void;
}

const LeafletMap = ({ onAreaCalculated }: LeafletMapProps) => {
  return (
    <MapContainer
      center={[31.9539, 35.9106]} // Centered on Amman, Jordan
      zoom={13}
      style={{ height: '100%', width: '100%' }}
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
