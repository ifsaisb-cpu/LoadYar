import React, { useEffect, useRef } from 'react';
import type { Geofence } from '../../hooks/useGpsTracking';

interface GeofenceLayerProps {
  map: any;
  geofences: Geofence[];
}

const GeofenceLayer: React.FC<GeofenceLayerProps> = ({ map, geofences }) => {
  const circlesRef = useRef<Map<number, any>>(new Map());

  useEffect(() => {
    if (!map) return;

    geofences.forEach((geofence) => {
      let circle = circlesRef.current.get(geofence.id);

      const fillColor = getGeofenceColor(geofence.delivery_zone_type);

      if (!circle) {
        circle = new (window as any).google.maps.Circle({
          center: { lat: geofence.latitude, lng: geofence.longitude },
          radius: geofence.radius_meters,
          map,
          fillColor,
          fillOpacity: 0.15,
          strokeColor: fillColor,
          strokeWeight: 2,
          strokeOpacity: 0.8,
          editable: false,
          title: geofence.name,
        });

        // Add click listener for info
        circle.addListener('click', () => {
          console.log(`Geofence: ${geofence.name} (${geofence.delivery_zone_type})`);
        });

        circlesRef.current.set(geofence.id, circle);
      } else {
        circle.setCenter({ lat: geofence.latitude, lng: geofence.longitude });
        circle.setRadius(geofence.radius_meters);
      }
    });

    // Remove circles for geofences no longer in the list
    circlesRef.current.forEach((circle, geofenceId) => {
      if (!geofences.find((g) => g.id === geofenceId)) {
        circle.setMap(null);
        circlesRef.current.delete(geofenceId);
      }
    });
  }, [map, geofences]);

  return null; // This component manages geofences via refs
};

const getGeofenceColor = (zoneType: string): string => {
  switch (zoneType) {
    case 'pickup':
      return '#3b82f6'; // Blue
    case 'delivery':
      return '#10b981'; // Green
    case 'warehouse':
      return '#f59e0b'; // Amber
    case 'restricted':
      return '#ef4444'; // Red
    default:
      return '#6b7280'; // Gray
  }
};

export default GeofenceLayer;
