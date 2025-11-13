import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Monitor, Smartphone, Tablet, Laptop } from 'lucide-react';
import { renderToString } from 'react-dom/server';

interface DeviceLocation {
  id: string;
  device_name: string;
  device_type: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  is_current: boolean;
  session_status?: 'active' | 'logged_in' | 'inactive' | 'logged_out';
}

interface DeviceMapViewProps {
  devices: DeviceLocation[];
  onDeviceClick?: (deviceId: string) => void;
}

const DeviceMapView: React.FC<DeviceMapViewProps> = ({ devices, onDeviceClick }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Get Lucide icon for device type
  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType?.toLowerCase()) {
      case 'smartphone':
        return Smartphone;
      case 'tablet':
        return Tablet;
      case 'laptop':
        return Laptop;
      case 'desktop':
        return Monitor;
      default:
        return Smartphone;
    }
  };

  // Get device icon color based on status
  const getDeviceColor = (deviceType: string, isCurrent: boolean, sessionStatus?: string) => {
    // Status-based colors (priority over device type)
    if (sessionStatus === 'active' || isCurrent) return '#10b981'; // green
    if (sessionStatus === 'logged_in') return '#f59e0b'; // amber
    if (sessionStatus === 'inactive') return '#9ca3af'; // gray
    
    // Device type colors (fallback)
    switch (deviceType) {
      case 'smartphone': return '#60a5fa'; // blue
      case 'tablet': return '#a78bfa'; // purple
      case 'laptop': return '#34d399'; // emerald
      case 'desktop': return '#fbbf24'; // yellow
      default: return '#f43f5e'; // red
    }
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
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    const existingMarkers = document.querySelectorAll('.maplibregl-marker');
    existingMarkers.forEach(marker => marker.remove());

    const bounds = new maplibregl.LngLatBounds();
    let validDevices = 0;
    const totalDevices = devices.length;

    devices.forEach(device => {
      const hasCoords = typeof device.latitude === 'number' && typeof device.longitude === 'number';
      const coords = hasCoords ? { lat: device.latitude as number, lng: device.longitude as number } : null;

      // Skip devices without valid coordinates
      if (!coords || Number.isNaN(coords.lat) || Number.isNaN(coords.lng)) {
        return;
      }

      validDevices++;

      // Get Lucide icon component
      const IconComponent = getDeviceIcon(device.device_type);
      const color = getDeviceColor(device.device_type, device.is_current, device.session_status);

      // Create custom marker element with Lucide icon
      const el = document.createElement('div');
      el.className = 'device-marker';

      // Render Lucide icon to HTML string
      const iconHtml = renderToString(
        <IconComponent size={24} color="white" strokeWidth={2} />
      );

      el.innerHTML = `
        <div style="
          width: 48px;
          height: 48px;
          background: ${color};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
          border: 3px solid ${device.is_current ? '#fff' : 'transparent'};
        ">
          ${iconHtml}
        </div>
      `;
      
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2)';
      });
      
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
      });

      if (onDeviceClick) {
        el.addEventListener('click', () => {
          onDeviceClick(device.id);
        });
      }

      // Create popup with status indicator
      const statusColor = device.session_status === 'active' || device.is_current ? '#10b981' : 
                         device.session_status === 'logged_in' ? '#f59e0b' : '#9ca3af';
      const statusText = device.session_status === 'active' || device.is_current ? 'Active' : 
                        device.session_status === 'logged_in' ? 'Logged In' : 'Inactive';
      
      const popup = new maplibregl.Popup({ offset: 25, closeButton: false })
        .setHTML(`
          <div style="padding: 8px;">
            <strong>${device.device_name}</strong><br/>
            <span style="font-size: 12px; color: #666;">${device.location || 'Unknown location'}</span><br/>
            <span style="color: ${statusColor}; font-size: 11px; font-weight: bold;">● ${statusText}</span>
            ${device.is_current ? '<br/><span style="color: #3b82f6; font-size: 11px; font-weight: 600;">⚡ Current Device</span>' : ''}
          </div>
        `);

      // Add marker to map
      new maplibregl.Marker({ element: el })
        .setLngLat([coords.lng, coords.lat])
        .setPopup(popup)
        .addTo(map.current!);

      bounds.extend([coords.lng, coords.lat]);
    });

    // Fit map to show all markers
    if (validDevices > 0 && map.current) {
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 8
      });
    }

    // Log info for debugging
    console.log(`📍 Showing ${validDevices} of ${totalDevices} devices on map`);
  }, [devices, mapLoaded, onDeviceClick]);

  const devicesWithCoords = devices.filter(d => 
    typeof d.latitude === 'number' && typeof d.longitude === 'number' &&
    !Number.isNaN(d.latitude) && !Number.isNaN(d.longitude)
  );

  if (devices.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-muted/20 rounded-lg">
        <p className="text-muted-foreground">No devices registered</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {devicesWithCoords.length < devices.length && (
        <div className="text-sm text-muted-foreground text-center py-2 px-4 bg-muted/30 rounded-md">
          Showing {devicesWithCoords.length} of {devices.length} devices on map
          {devicesWithCoords.length === 0 && ' (location data being collected)'}
        </div>
      )}
      <div ref={mapContainer} className="w-full h-[400px] rounded-lg border border-border" />
    </div>
  );
};

export default DeviceMapView;
