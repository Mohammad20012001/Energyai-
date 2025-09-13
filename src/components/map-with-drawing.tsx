'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, DrawingManager, Polygon } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100%',
};

// Center of Jordan
const center = {
  lat: 31.83,
  lng: 36.24,
};

const libraries: ('drawing' | 'geometry')[] = ['drawing', 'geometry'];

interface MapWithDrawingProps {
  onAreaUpdate: (area: number) => void;
}

function MapWithDrawing({ onAreaUpdate }: MapWithDrawingProps) {
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  
  useEffect(() => {
    if (!googleMapsApiKey) {
      console.error("Google Maps API key is missing. Please check your .env.local file and ensure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set.");
    }
  }, [googleMapsApiKey]);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: googleMapsApiKey,
    libraries: libraries,
  });

  const [path, setPath] = useState<google.maps.LatLngLiteral[]>([]);
  const polygonRef = useRef<google.maps.Polygon | null>(null);

  const onPolygonComplete = (polygon: google.maps.Polygon) => {
    // Get the path of the completed polygon
    const newPath = polygon.getPath().getArray().map(latLng => latLng.toJSON());
    setPath(newPath);

    // Calculate area
    if (window.google && window.google.maps && window.google.maps.geometry) {
        const areaInMeters = window.google.maps.geometry.spherical.computeArea(polygon.getPath());
        onAreaUpdate(areaInMeters);
    }
    
    // The DrawingManager adds its own polygon, so we hide it and show our own managed one.
    polygon.setMap(null); 
  };
  
  const onMapLoad = useCallback(() => {
    // You can do something on map load if needed
  }, []);

  const onUnmount = useCallback(() => {
    // Cleanup
  }, []);

  if (loadError) {
    return <div>خطأ في تحميل الخريطة. يرجى التحقق من صلاحية مفتاح API وتفعيله.</div>;
  }

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={8}
      onLoad={onMapLoad}
      onUnmount={onUnmount}
      options={{
        mapTypeControl: false,
        streetViewControl: false,
      }}
    >
      <DrawingManager
        onPolygonComplete={onPolygonComplete}
        options={{
          drawingControl: true,
          drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_CENTER,
            drawingModes: [
              google.maps.drawing.OverlayType.POLYGON,
              google.maps.drawing.OverlayType.RECTANGLE,
            ],
          },
          polygonOptions: {
            fillColor: 'hsl(var(--primary))',
            fillOpacity: 0.3,
            strokeWeight: 2,
            strokeColor: 'hsl(var(--primary))',
            clickable: false,
            editable: false,
            zIndex: 1,
          },
           rectangleOptions: {
            fillColor: 'hsl(var(--primary))',
            fillOpacity: 0.3,
            strokeWeight: 2,
            strokeColor: 'hsl(var(--primary))',
            clickable: false,
            editable: false,
            zIndex: 1,
          },
        }}
      />
      {/* We render our own polygon so we can clear it */}
      {path.length > 0 && (
         <Polygon
            ref={polygonRef}
            paths={path}
            options={{
                fillColor: 'hsl(var(--primary))',
                fillOpacity: 0.4,
                strokeWeight: 2,
                strokeColor: 'hsl(var(--primary))',
            }}
        />
      )}
    </GoogleMap>
  ) : <div className="flex h-full w-full items-center justify-center bg-muted">...جاري تحميل الخريطة</div>;
}

export default React.memo(MapWithDrawing);
