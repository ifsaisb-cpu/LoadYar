import React, { useEffect, useRef } from 'react';
import type { DriverLocation } from '../../hooks/useGpsTracking';

interface HeatmapLayerProps {
  map: any;
  drivers: DriverLocation[];
  visible: boolean;
}

const HeatmapLayer: React.FC<HeatmapLayerProps> = ({ map, drivers, visible }) => {
  const heatmapRef = useRef<any>(null);

  useEffect(() => {
    if (!map || !visible) {
      if (heatmapRef.current) {
        heatmapRef.current.setMap(null);
      }
      return;
    }

    // Load visualization library if not already loaded
    const script = document.createElement('script');
    script.src =
      'https://maps.googleapis.com/maps/api/js?libraries=visualization';
    script.async = true;

    script.onload = () => {
      // Convert driver locations to heat map data points
      const heatmapData = drivers.map((driver) => ({
        location: new (window as any).google.maps.LatLng(
          driver.latitude,
          driver.longitude,
        ),
        weight: driver.status === 'active' ? 3 : driver.status === 'idle' ? 2 : 1,
      }));

      if (heatmapRef.current) {
        heatmapRef.current.setMap(null);
      }

      heatmapRef.current = new (window as any).google.maps.visualization.HeatmapLayer({
        data: heatmapData,
        map,
        radius: 50,
        opacity: 0.6,
        gradient: [
          'rgba(0, 255, 255, 0)',
          'rgba(0, 255, 255, 1)',
          'rgba(0, 191, 255, 1)',
          'rgba(0, 127, 255, 1)',
          'rgba(0, 63, 255, 1)',
          'rgba(0, 0, 255, 1)',
          'rgba(63, 0, 255, 1)',
          'rgba(127, 0, 255, 1)',
          'rgba(191, 0, 255, 1)',
          'rgba(255, 0, 255, 1)',
          'rgba(255, 0, 191, 1)',
          'rgba(255, 0, 127, 1)',
          'rgba(255, 0, 63, 1)',
          'rgba(255, 0, 0, 1)',
        ],
      });
    };

    if (!document.querySelector('script[src*="visualization"]')) {
      document.head.appendChild(script);
    } else {
      script.onload?.();
    }

    return () => {
      if (heatmapRef.current) {
        heatmapRef.current.setMap(null);
      }
    };
  }, [map, drivers, visible]);

  return null; // This component manages the heatmap via refs
};

export default HeatmapLayer;
