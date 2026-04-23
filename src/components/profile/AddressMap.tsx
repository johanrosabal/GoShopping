'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Sub-component to handle smooth recentering
function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (map) {
      map.setView(center, map.getZoom(), { animate: true });
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

export default function AddressMap({ initialCenter = [9.9333, -84.0833], onLocationChange }: AddressMapProps) {
  const [position, setPosition] = useState<[number, number]>(initialCenter);
  const [isFullyMounted, setIsFullyMounted] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    
    // HEAVY GUARD: We wait for the host <div> to be physically present in the DOM
    const checkPresence = () => {
      if (!mounted) return;
      if (hostRef.current && document.body.contains(hostRef.current)) {
        // Wait an extra 500ms for style recalculations
        setTimeout(() => {
          if (mounted) setIsFullyMounted(true);
        }, 500);
      } else {
        setTimeout(checkPresence, 300);
      }
    };

    checkPresence();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (initialCenter[0] !== position[0] || initialCenter[1] !== position[1]) {
      setPosition(initialCenter);
    }
  }, [initialCenter]);

  const customIcon = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: var(--brand-accent); width: 24px; height: 24px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid black; display: flex; align-items: center; justify-content: center;"><div style="background: black; width: 8px; height: 8px; border-radius: 50%;"></div></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 24]
    });
  }, []);

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

  return (
    <div 
      ref={hostRef} 
      style={{ 
        height: '300px', 
        width: '100%', 
        marginBottom: '20px', 
        borderRadius: '4px', 
        overflow: 'hidden', 
        border: '1px solid var(--border)', 
        position: 'relative',
        background: 'rgba(255,255,255,0.02)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {!isFullyMounted ? (
        <div style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Loader2 className="spin" size={14} />
          Sincronizando Satélite...
        </div>
      ) : (
        <MapContainer 
          center={initialCenter} 
          zoom={17} 
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
          key="merchant-address-map-v2"
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          {customIcon && (
            <Marker 
              position={position} 
              draggable={true}
              icon={customIcon}
              eventHandlers={{
                dragend: handleMarkerDrag
              }}
            />
          )}
          <MapEvents onMapClick={handleMapClick} />
          <MapRecenter center={position} />
        </MapContainer>
      )}
    </div>
  );
}
