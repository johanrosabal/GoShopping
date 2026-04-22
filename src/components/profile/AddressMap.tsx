'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Sub-component to handle smooth recentering without re-mounting the whole MapContainer
function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap();
  const prevCenter = useRef<[number, number]>(center);

  useEffect(() => {
    if (center[0] !== prevCenter.current[0] || center[1] !== prevCenter.current[1]) {
      // If we are at a very low zoom (initial), force a closer zoom on first move
      const currentZoom = map.getZoom();
      const targetZoom = currentZoom < 15 ? 17 : currentZoom;
      map.setView(center, targetZoom, { animate: true });
      prevCenter.current = center;
    }
  }, [center, map]);
  
  return null;
}

interface AddressMapProps {
  initialCenter?: [number, number];
  onLocationChange: (lat: number, lng: number) => void;
}

function MapEvents({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Guard component to ensure layers are only added once the map instance is stable
function MapLayersGuard({ children }: { children: React.ReactNode }) {
  const map = useMap();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (map) {
      // Small timeout to ensure the DOM container is fully attached
      const timer = setTimeout(() => setIsReady(true), 50);
      return () => clearTimeout(timer);
    }
  }, [map]);

  if (!isReady) return null;
  return <>{children}</>;
}

export default function AddressMap({ initialCenter = [9.9333, -84.0833], onLocationChange }: AddressMapProps) {
  const [position, setPosition] = useState<[number, number]>(initialCenter);
  const [mounted, setMounted] = useState(false);

  // Safety check to ensure Leaflet only runs on the client
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Sync internal position when initialCenter changes (e.g. from GPS capture or URL paste)
  useEffect(() => {
    if (initialCenter[0] !== position[0] || initialCenter[1] !== position[1]) {
      setPosition(initialCenter);
    }
  }, [initialCenter]);

  // Create custom icon only once
  const customIcon = useMemo(() => L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: var(--brand-accent); width: 24px; height: 24px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid black; display: flex; align-items: center; justify-content: center;"><div style="background: black; width: 8px; height: 8px; border-radius: 50%;"></div></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24]
  }), []);

  const handleMarkerDrag = (e: L.DragEndEvent) => {
    const marker = e.target;
    if (marker) {
      const { lat, lng } = marker.getLatLng();
      setPosition([lat, lng]);
      onLocationChange(lat, lng);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    onLocationChange(lat, lng);
  };

  if (!mounted) {
    return <div style={{ height: '300px', width: '100%', marginBottom: '20px', background: 'var(--bg-tertiary)', borderRadius: '4px' }} />;
  }

  return (
    <div style={{ height: '300px', width: '100%', marginBottom: '20px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border)', position: 'relative' }}>
      <MapContainer 
        center={initialCenter} 
        zoom={17} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <MapLayersGuard>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <Marker 
            position={position} 
            draggable={true}
            icon={customIcon}
            eventHandlers={{
              dragend: handleMarkerDrag
            }}
          />
          <MapEvents onMapClick={handleMapClick} />
          <MapRecenter center={position} />
        </MapLayersGuard>
      </MapContainer>
    </div>
  );
}
