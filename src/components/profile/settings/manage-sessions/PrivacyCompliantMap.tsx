import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface PrivacyCompliantMapProps {
  latitude: number;
  longitude: number;
  city?: string | null;
  country?: string | null;
  className?: string;
}

export const PrivacyCompliantMap = ({ 
  latitude, 
  longitude, 
  city, 
  country,
  className = "w-full h-full"
}: PrivacyCompliantMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');

  useEffect(() => {
    // Get Mapbox token from environment or prompt user
    const token = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN;
    if (token) {
      setMapboxToken(token);
    }
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    // Round coordinates to 2 decimals for privacy (approx 1.1km precision)
    const roundedLat = Math.round(latitude * 100) / 100;
    const roundedLng = Math.round(longitude * 100) / 100;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [roundedLng, roundedLat],
      zoom: 9, // City level zoom, not street level
      interactive: false, // Disable all interactions
      attributionControl: false,
    });

    // Add blur effect for privacy
    map.current.on('load', () => {
      // Add a circle to show approximate location area (5km radius)
      if (map.current) {
        map.current.addLayer({
          id: 'location-circle',
          type: 'circle',
          source: {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [roundedLng, roundedLat]
              },
              properties: {}
            }
          },
          paint: {
            'circle-radius': 40,
            'circle-color': '#3b82f6',
            'circle-opacity': 0.3,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#3b82f6',
            'circle-stroke-opacity': 0.8
          }
        });
      }
    });

    return () => {
      map.current?.remove();
    };
  }, [latitude, longitude, mapboxToken]);

  if (!mapboxToken) {
    return (
      <div className={`${className} bg-muted rounded-lg flex items-center justify-center`}>
        <div className="text-center p-4">
          <p className="text-xs text-muted-foreground mb-2">Map unavailable</p>
          <p className="text-xs text-muted-foreground">
            {city && country ? `${city}, ${country}` : 'Location data'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} relative rounded-lg overflow-hidden`}>
      <div ref={mapContainer} className="absolute inset-0" />
      {/* Privacy blur overlay */}
      <div className="absolute inset-0 backdrop-blur-[2px] pointer-events-none" />
      {/* Location label */}
      <div className="absolute bottom-2 left-2 bg-background/90 backdrop-blur-sm px-2 py-1 rounded text-xs">
        {city && country ? `${city}, ${country}` : 'Approximate location'}
      </div>
    </div>
  );
};
