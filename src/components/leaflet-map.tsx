'use client';

import { useMap } from 'react-leaflet';
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
    // Fix for default icon issues with webpack
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    if (!map.pm) {
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
    }


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
      // It's often better not to remove controls to avoid re-initialization issues
      // if (map.pm) {
      //   map.pm.removeControls();
      // }
    };
  }, [map, onAreaCalculated]);

  return null;
};

export default DrawingManager;
