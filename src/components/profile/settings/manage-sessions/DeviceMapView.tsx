import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Monitor, Smartphone, Tablet, Laptop } from 'lucide-react';

interface DeviceLocation {
  id: string;
  device_name: string;
  device_type: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  is_current: boolean;
}

interface DeviceMapViewProps {
  devices: DeviceLocation[];
  onDeviceClick?: (deviceId: string) => void;
}

const DeviceMapView: React.FC<DeviceMapViewProps> = ({ devices, onDeviceClick }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Get device icon color
  const getDeviceColor = (deviceType: string, isCurrent: boolean) => {
    if (isCurrent) return '#3b82f6'; // blue
    switch (deviceType) {
      case 'smartphone': return '#60a5fa';
      case 'tablet': return '#a78bfa';
      case 'laptop': return '#34d399';
      case 'desktop': return '#fbbf24';
      default: return '#f43f5e';
    }
  };

  // Mock geocoding function (replace with real API in production)
  const geocodeLocation = (location?: string): { lat: number; lng: number } => {
    // For demo purposes, return random coordinates
    // In production, use a real geocoding API
    const cities = {
      'New York': { lat: 40.7128, lng: -74.0060 },
      'London': { lat: 51.5074, lng: -0.1278 },
      'Tokyo': { lat: 35.6762, lng: 139.6503 },
      'Paris': { lat: 48.8566, lng: 2.3522 },
      'Sydney': { lat: -33.8688, lng: 151.2093 },
      'Unknown location': { lat: 0, lng: 0 }
    };

    if (location) {
      for (const [city, coords] of Object.entries(cities)) {
        if (location.includes(city)) return coords;
      }
    }
    
    // Random location if not found
    return {
      lat: (Math.random() - 0.5) * 160,
      lng: (Math.random() - 0.5) * 360
    };
  };

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [0, 20],
      zoom: 1.5,
      pitch: 0,
    });

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    // Cleanup
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    if (!map.current || !mapLoaded || devices.length === 0) return;

    // Clear existing markers
    const existingMarkers = document.querySelectorAll('.maplibregl-marker');
    existingMarkers.forEach(marker => marker.remove());

    const bounds = new maplibregl.LngLatBounds();

    // Add markers for each device
    devices.forEach(device => {
      const coords = device.latitude && device.longitude
        ? { lat: device.latitude, lng: device.longitude }
        : geocodeLocation(device.location);

      if (coords.lat === 0 && coords.lng === 0) return; // Skip unknown locations

      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'device-marker';
      el.style.cssText = `
        width: 32px;
        height: 32px;
        background-color: ${getDeviceColor(device.device_type, device.is_current)};
        border: 3px solid white;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s, box-shadow 0.2s;
      `;

      // Add device icon
      const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      iconSvg.setAttribute('width', '16');
      iconSvg.setAttribute('height', '16');
      iconSvg.setAttribute('viewBox', '0 0 24 24');
      iconSvg.setAttribute('fill', 'white');
      iconSvg.setAttribute('stroke', 'white');
      iconSvg.setAttribute('stroke-width', '2');
      
      let iconPath = '';
      switch (device.device_type) {
        case 'smartphone':
          iconPath = 'M17 2H7c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H7V4h10v16z';
          break;
        case 'tablet':
          iconPath = 'M21 4H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H3V6h18v12z';
          break;
        case 'laptop':
          iconPath = 'M20 18v-1c1.1 0 1.99-.9 1.99-2L22 5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2v1H0v2h24v-2h-4zM4 5h16v10H4V5z';
          break;
        default:
          iconPath = 'M20 3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h3l-1 1v2h12v-2l-1-1h3c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 13H4V5h16v11z';
      }
      
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', iconPath);
      iconSvg.appendChild(path);
      el.appendChild(iconSvg);

      // Hover effect
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2)';
        el.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
        el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
      });

      // Click event
      el.addEventListener('click', () => {
        if (onDeviceClick) {
          onDeviceClick(device.id);
        }
      });

      // Create popup
      const popup = new maplibregl.Popup({ offset: 25, closeButton: false })
        .setHTML(`
          <div style="padding: 8px;">
            <strong>${device.device_name}</strong><br/>
            <span style="font-size: 12px; color: #666;">${device.location || 'Unknown location'}</span>
            ${device.is_current ? '<br/><span style="color: #3b82f6; font-size: 11px; font-weight: bold;">● Current Device</span>' : ''}
          </div>
        `);

      // Add marker to map
      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([coords.lng, coords.lat])
        .setPopup(popup)
        .addTo(map.current!);

      bounds.extend([coords.lng, coords.lat]);
    });

    // Fit map to show all markers
    if (devices.length > 0) {
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 5
      });
    }
  }, [devices, mapLoaded, onDeviceClick]);

  return (
    <div className="relative w-full h-[400px] rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      <div ref={mapContainer} className="absolute inset-0" />
      {devices.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <p className="text-gray-500 text-sm">No device locations to display</p>
        </div>
      )}
    </div>
  );
};

export default DeviceMapView;
