import React, { useEffect, useRef } from 'react';
import type { DriverLocation } from '../../hooks/useGpsTracking';

interface DriverMarkersProps {
  map: any;
  drivers: DriverLocation[];
  selectedDriver: DriverLocation | null;
  onSelectDriver: (driver: DriverLocation) => void;
}

const DriverMarkers: React.FC<DriverMarkersProps> = ({
  map,
  drivers,
  selectedDriver,
  onSelectDriver,
}) => {
  const markersRef = useRef<Map<number, any>>(new Map());
  const infoWindowRef = useRef<any>(null);

  useEffect(() => {
    if (!map) return;

    drivers.forEach((driver) => {
      let marker = markersRef.current.get(driver.driver_id);

      const iconUrl = getMarkerIcon(driver.status);

      if (!marker) {
        marker = new (window as any).google.maps.Marker({
          position: { lat: driver.latitude, lng: driver.longitude },
          map,
          title: driver.driver_name,
          icon: iconUrl,
        });

        marker.addListener('click', () => {
          if (infoWindowRef.current) {
            infoWindowRef.current.close();
          }

          const content = `
            <div style="padding: 10px; font-size: 12px;">
              <strong>${driver.driver_name}</strong><br/>
              Speed: ${driver.speed.toFixed(1)} km/h<br/>
              Status: ${driver.status}<br/>
              <button onclick="window.showDriverDetails('${driver.driver_id}')" style="margin-top: 8px; padding: 4px 8px; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer;">View Details</button>
            </div>
          `;

          infoWindowRef.current = new (window as any).google.maps.InfoWindow({
            content,
          });

          infoWindowRef.current.open(map, marker);
          onSelectDriver(driver);
        });

        markersRef.current.set(driver.driver_id, marker);
      } else {
        marker.setPosition({ lat: driver.latitude, lng: driver.longitude });
        marker.setIcon(iconUrl);
      }

      // Highlight selected driver
      if (selectedDriver?.driver_id === driver.driver_id) {
        marker.setScale(1.5);
        marker.setZIndex((window as any).google.maps.Marker.MAX_ZINDEX + 1);
      } else {
        marker.setScale(1);
        marker.setZIndex((window as any).google.maps.Marker.MAX_ZINDEX);
      }
    });

    // Remove markers for drivers no longer in the list
    markersRef.current.forEach((marker, driverId) => {
      if (!drivers.find((d) => d.driver_id === driverId)) {
        marker.setMap(null);
        markersRef.current.delete(driverId);
      }
    });
  }, [map, drivers, selectedDriver, onSelectDriver]);

  return null; // This component manages markers via refs
};

const getMarkerIcon = (status: string): string => {
  // Using Google's marker colors
  const baseUrl = 'https://maps.google.com/mapfiles/ms/icons/';
  switch (status) {
    case 'active':
      return baseUrl + 'green-dot.png';
    case 'idle':
      return baseUrl + 'yellow-dot.png';
    case 'offline':
      return baseUrl + 'red-dot.png';
    default:
      return baseUrl + 'blue-dot.png';
  }
};

export default DriverMarkers;
