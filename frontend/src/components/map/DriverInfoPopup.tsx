import React from 'react';
import { X, Navigation, AlertCircle, TrendingUp, Star } from 'lucide-react';
import type { DriverLocation } from '../../hooks/useGpsTracking';

interface DriverInfoPopupProps {
  driver: DriverLocation;
  onClose: () => void;
}

const DriverInfoPopup: React.FC<DriverInfoPopupProps> = ({ driver, onClose }) => {
  const getStatusBadge = () => {
    switch (driver.status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'idle':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'offline':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className="absolute right-4 bottom-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl w-80 z-20 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">{driver.driver_name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <div
              className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge()}`}
            >
              {driver.status.charAt(0).toUpperCase() + driver.status.slice(1)}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:bg-blue-600 p-1 rounded transition"
        >
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Location */}
        <div className="flex items-start gap-3">
          <Navigation size={16} className="text-blue-600 mt-1 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Current Location</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {driver.latitude.toFixed(4)}, {driver.longitude.toFixed(4)}
            </p>
          </div>
        </div>

        {/* Speed & Heading */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
            <p className="text-xs text-gray-600 dark:text-gray-400">Speed</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {driver.speed.toFixed(1)}
              <span className="text-sm text-gray-500"> km/h</span>
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
            <p className="text-xs text-gray-600 dark:text-gray-400">Heading</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {driver.heading.toFixed(0)}°
            </p>
          </div>
        </div>

        {/* Accuracy & Altitude */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded">
            <p className="text-xs text-gray-600 dark:text-gray-400">Accuracy</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              ±{driver.accuracy.toFixed(0)} m
            </p>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded">
            <p className="text-xs text-gray-600 dark:text-gray-400">Altitude</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {driver.altitude.toFixed(0)} m
            </p>
          </div>
        </div>

        {/* Trip Info */}
        {driver.trip_id && (
          <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded">
            <p className="text-xs text-gray-600 dark:text-gray-400">Active Trip</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Trip #{driver.trip_id}
            </p>
          </div>
        )}

        {/* Last Updated */}
        <div className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-2">
          Last updated: {new Date(driver.timestamp).toLocaleTimeString()}
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3 flex gap-2">
        <button className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition">
          Call Driver
        </button>
        <button className="flex-1 px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-medium rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition">
          Message
        </button>
      </div>
    </div>
  );
};

export default DriverInfoPopup;
