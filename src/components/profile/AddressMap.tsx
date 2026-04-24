'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import { Loader2, Search } from 'lucide-react';
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

// Componente de seguridad para evitar errores de appendChild en React 18/19
function SafeTileLayer(props: any) {
  const map = useMap();
  const [isMapReady, setIsMapReady] = useState(false);
  
  useEffect(() => {
    if (map) {
      const timer = setTimeout(() => setIsMapReady(true), 50);
      return () => clearTimeout(timer);
    }
  }, [map]);

  if (!isMapReady || !map) return null;
  return <TileLayer {...props} />;
}

export default function AddressMap({ initialCenter = [9.9333, -84.0833], onLocationChange }: AddressMapProps) {
  const [position, setPosition] = useState<[number, number]>(initialCenter);
  const [isFullyMounted, setIsFullyMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    
    const checkPresence = () => {
      if (!mounted) return;
      if (hostRef.current && document.body.contains(hostRef.current)) {
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

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&countrycodes=cr`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const selectLocation = (result: any) => {
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    setPosition([lat, lon]);
    onLocationChange(lat, lon);
    setSearchResults([]);
    setSearchQuery(result.display_name);
  };

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
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Search Bar Overlay */}
      <div style={{ 
        position: 'absolute', 
        top: '12px', 
        left: '12px', 
        right: '12px', 
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input 
              type="text" 
              placeholder="Buscar comercio o lugar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              style={{
                width: '100%',
                padding: '10px 16px',
                paddingRight: '40px',
                background: 'rgba(0,0,0,0.85)',
                backdropFilter: 'blur(8px)',
                border: '1px solid var(--brand-accent)',
                color: 'white',
                fontSize: '0.85rem',
                borderRadius: '4px',
                outline: 'none',
                boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
              }}
            />
            <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
              {isSearching ? <Loader2 className="spin" size={16} color="var(--brand-accent)" /> : <Search size={16} color="var(--brand-accent)" />}
            </div>
          </div>
          <button 
            type="button"
            onClick={handleSearch}
            style={{
              padding: '0 16px',
              background: 'var(--brand-accent)',
              color: 'black',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 700,
              fontSize: '0.7rem',
              cursor: 'pointer',
              textTransform: 'uppercase'
            }}
          >
            Buscar
          </button>
        </div>

        {searchResults.length > 0 && (
          <div style={{
            background: 'rgba(0,0,0,0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '4px',
            overflow: 'hidden',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
          }}>
            {searchResults.map((result, idx) => (
              <div 
                key={idx}
                onClick={() => selectLocation(result)}
                style={{
                  padding: '10px 16px',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  borderBottom: idx === searchResults.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                {result.display_name}
              </div>
            ))}
          </div>
        )}
      </div>

      <div 
        ref={hostRef} 
        style={{ 
          height: '350px', 
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
            center={position} 
            zoom={17} 
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={false}
            zoomControl={false}
            key={`map-${position[0]}-${position[1]}`}
          >
            <SafeTileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            <ZoomControl position="bottomright" />
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
    </div>
  );
}
