
'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import '@geoman-io/leaflet-geoman-free';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';

interface LeafletMapProps {
  onAreaCalculated: (area: number) => void;
}

const LeafletMap = ({ onAreaCalculated }: LeafletMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const onAreaCalculatedRef = useRef(onAreaCalculated);

  useEffect(() => {
    onAreaCalculatedRef.current = onAreaCalculated;
  }, [onAreaCalculated]);

  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current, {
        center: [31.9539, 35.9106], // Centered on Amman, Jordan
        zoom: 13,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

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

      const calculateAndCallback = (layer: L.Layer) => {
        if (layer instanceof L.Polygon) {
          const area = L.GeometryUtil.geodesicArea((layer as L.Polygon).getLatLngs()[0] as L.LatLng[]);
          onAreaCalculatedRef.current(area);
        }
      };
      
      const handleCreate = (e: any) => {
          const { layer } = e;
          
          // Remove previous layers
          map.eachLayer((l: any) => {
            if (l.pm && (l instanceof L.Polygon || l instanceof L.Rectangle) && l !== layer) {
              l.remove();
            }
          });

          calculateAndCallback(layer);

          // Add an edit listener to the new layer
          layer.on('pm:edit', (editEvent: any) => {
             calculateAndCallback(editEvent.layer);
          });
      };

      map.on('pm:create', handleCreate);

      mapInstance.current = map;
    }
  }, []);

  return <div ref={mapRef} style={{ height: '100%', width: '100%' }} />;
};

export default LeafletMap;
