import React, { useEffect, useRef } from 'react';
import type { RouteWaypoint } from '../../hooks/useGpsTracking';

interface RouteVisualizationProps {
  map: any;
  waypoints: RouteWaypoint[];
}

const RouteVisualization: React.FC<RouteVisualizationProps> = ({ map, waypoints }) => {
  const polylineRef = useRef<any>(null);
  const waypointMarkersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!map || waypoints.length === 0) return;

    // Clear previous polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }

    // Clear previous waypoint markers
    waypointMarkersRef.current.forEach((marker) => marker.setMap(null));
    waypointMarkersRef.current = [];

    // Sort waypoints by sequence
    const sortedWaypoints = [...waypoints].sort((a, b) => a.sequence - b.sequence);

    // Create polyline
    const pathCoordinates = sortedWaypoints.map((wp) => ({
      lat: wp.latitude,
      lng: wp.longitude,
    }));

    polylineRef.current = new (window as any).google.maps.Polyline({
      path: pathCoordinates,
      geodesic: true,
      strokeColor: '#2563eb',
      strokeOpacity: 0.8,
      strokeWeight: 3,
      map,
      editable: false,
      clickable: true,
    });

    // Add markers for waypoints
    sortedWaypoints.forEach((waypoint, index) => {
      const isStart = index === 0;
      const isEnd = index === sortedWaypoints.length - 1;

      const marker = new (window as any).google.maps.Marker({
        position: { lat: waypoint.latitude, lng: waypoint.longitude },
        map,
        title: waypoint.address || `Waypoint ${index + 1}`,
        icon: getWaypointIcon(isStart, isEnd),
        label: {
          text: `${index + 1}`,
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold',
        },
      });

      marker.addListener('click', () => {
        const content = `
          <div style="padding: 10px; font-size: 12px; max-width: 200px;">
            <strong>${isStart ? 'Start' : isEnd ? 'End' : 'Waypoint ' + (index + 1)}</strong><br/>
            Location: ${waypoint.address || `${waypoint.latitude.toFixed(4)}, ${waypoint.longitude.toFixed(4)}`}<br/>
            Time: ${new Date(waypoint.timestamp).toLocaleTimeString()}<br/>
          </div>
        `;

        const infoWindow = new (window as any).google.maps.InfoWindow({ content });
        infoWindow.open(map, marker);
      });

      waypointMarkersRef.current.push(marker);
    });

    // Fit map bounds to show entire route
    const bounds = new (window as any).google.maps.LatLngBounds();
    pathCoordinates.forEach((coord) => bounds.extend(coord));
    map.fitBounds(bounds);
  }, [map, waypoints]);

  return null; // This component manages the route via refs
};

const getWaypointIcon = (isStart: boolean, isEnd: boolean): string => {
  if (isStart) return 'https://maps.google.com/mapfiles/ms/icons/green-dot.png';
  if (isEnd) return 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
  return 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png';
};

export default RouteVisualization;
