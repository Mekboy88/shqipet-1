import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Monitor, Laptop, Smartphone, Tablet } from 'lucide-react';
import { renderToString } from 'react-dom/server';

interface MiniMapViewProps {
  latitude?: number;
  longitude?: number;
  deviceName?: string;
  deviceType?: string;
  city?: string;
  country?: string;
  height?: string;
}

const MiniMapView: React.FC<MiniMapViewProps> = ({
  latitude,
  longitude,
  deviceName = 'Device',
  deviceType = 'unknown',
  city,
  country,
  height = '200px',
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || !latitude || !longitude) return;

    // Initialize map
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [longitude, latitude],
      zoom: 10,
    });

    // Add attribution control
    map.current.addControl(new maplibregl.AttributionControl(), 'bottom-right');

    // Get device icon
    const getDeviceIcon = () => {
      const iconProps = { size: 20, color: '#2AA1FF' };
      switch (deviceType.toLowerCase()) {
        case 'smartphone':
        case 'mobile':
          return <Smartphone {...iconProps} />;
        case 'tablet':
          return <Tablet {...iconProps} />;
        case 'laptop':
          return <Laptop {...iconProps} />;
        case 'desktop':
          return <Monitor {...iconProps} />;
        default:
          return <Monitor {...iconProps} />;
      }
    };

    // Create custom marker
    const markerElement = document.createElement('div');
    markerElement.className = 'custom-marker';
    markerElement.innerHTML = `
      <div class="flex flex-col items-center justify-center">
        <div class="bg-primary p-2 rounded-full shadow-lg border-2 border-white">
          ${renderToString(getDeviceIcon())}
        </div>
      </div>
    `;
    markerElement.style.cssText = 'cursor: pointer;';

    // Add marker
    const marker = new maplibregl.Marker({
      element: markerElement,
    })
      .setLngLat([longitude, latitude])
      .addTo(map.current);

    // Add popup
    const popup = new maplibregl.Popup({
      offset: 25,
      closeButton: false,
    }).setHTML(`
      <div class="p-2">
        <p class="font-semibold text-sm">${deviceName}</p>
        <p class="text-xs text-muted-foreground">${city || 'Unknown'}, ${country || 'Unknown'}</p>
      </div>
    `);

    marker.setPopup(popup);

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [latitude, longitude, deviceName, deviceType, city, country]);

  if (!latitude || !longitude) {
    return (
      <div 
        className="bg-muted/30 rounded-lg flex items-center justify-center border border-border"
        style={{ height }}
      >
        <p className="text-sm text-muted-foreground">Location data unavailable</p>
      </div>
    );
  }

  return (
    <div 
      ref={mapContainer} 
      className="rounded-lg border border-border overflow-hidden"
      style={{ height }}
    />
  );
};

export default MiniMapView;