
'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Monkey patch the Leaflet Default Icon to fix loading issues
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface LocationPickerMapProps {
  onLocationSelected: (lat: number, lng: number) => void;
  initialCenter: { lat: number; lng: number };
}

const LocationPickerMap = ({ onLocationSelected, initialCenter }: LocationPickerMapProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onLocationSelectedRef = useRef(onLocationSelected);

  // Keep the ref updated with the latest callback function
  useEffect(() => {
    onLocationSelectedRef.current = onLocationSelected;
  }, [onLocationSelected]);

  useEffect(() => {
    // Ensure this runs only on the client and that the container exists
    if (typeof window === 'undefined' || !mapContainerRef.current) {
      return;
    }


    // Initialize the map only if it hasn't been initialized yet
    if (!mapInstanceRef.current) {
        mapInstanceRef.current = L.map(mapContainerRef.current).setView([initialCenter.lat, initialCenter.lng], 10);
        
        // --- Define Base Layers ---
        const streetLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            maxZoom: 19
        });

        const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, & the GIS User Community'
        });

        const darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            maxZoom: 19
        });

        // --- Define Overlay Layer for Labels ---
        const labelsLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://carto.com/attributions">CARTO</a>',
            pane: 'shadowPane' // Ensures labels appear on top of other layers
        });
        
        streetLayer.addTo(mapInstanceRef.current); // Set default layer
        labelsLayer.addTo(mapInstanceRef.current); // Show labels by default


        // --- Create Layer Control ---
        const baseMaps = {
            "شوارع": streetLayer,
            "قمر صناعي": satelliteLayer,
            "مظلم": darkLayer,
        };

        const overlayMaps = {
            "إظهار التقسيمات": labelsLayer
        };

        L.control.layers(baseMaps, overlayMaps).addTo(mapInstanceRef.current);
    }
    
    const map = mapInstanceRef.current;
    
    // Add or update the marker
    if (!markerRef.current) {
        markerRef.current = L.marker([initialCenter.lat, initialCenter.lng], { draggable: true }).addTo(map);
    } else {
        markerRef.current.setLatLng([initialCenter.lat, initialCenter.lng]);
    }
    
    const marker = markerRef.current;

    // --- Event Listeners ---
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng(e.latlng);
      onLocationSelectedRef.current(lat, lng);
    };

    const handleMarkerDrag = () => {
      const { lat, lng } = marker.getLatLng();
      onLocationSelectedRef.current(lat, lng);
    };

    map.on('click', handleMapClick);
    marker.on('dragend', handleMarkerDrag);


    // Cleanup function to run when the component unmounts
    return () => {
        map.off('click', handleMapClick);
        marker.off('dragend', handleMarkerDrag);
    };
  }, [initialCenter]); // Re-run effect if initialCenter changes

  return <div ref={mapContainerRef} style={{ height: '100%', width: '100%' }} />;
};

export default LocationPickerMap;
