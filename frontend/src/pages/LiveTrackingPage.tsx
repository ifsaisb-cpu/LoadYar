import React, { useState } from 'react';
import { ChevronLeft, MapPin } from 'lucide-react';
import GpsMap from '../components/GpsMap';

interface LiveTrackingPageProps {
  tenantId: number;
  onBack?: () => void;
}

const LiveTrackingPage: React.FC<LiveTrackingPageProps> = ({ tenantId, onBack }) => {
  const [showStats, setShowStats] = useState(true);

  return (
    <div className="w-full h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-700 rounded-lg transition text-white"
            >
              <ChevronLeft size={24} />
            </button>
          )}
          <div className="flex items-center gap-2">
            <MapPin size={24} className="text-blue-500" />
            <h1 className="text-2xl font-bold text-white">Live Vehicle Tracking</h1>
          </div>
        </div>

        <button
          onClick={() => setShowStats(!showStats)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          {showStats ? 'Hide' : 'Show'} Stats
        </button>
      </div>

      {/* Main Map */}
      <div className="flex-1 relative">
        <GpsMap tenantId={tenantId} />
      </div>

      {/* Footer Info */}
      <div className="bg-gray-800 border-t border-gray-700 p-3 text-sm text-gray-300">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Active Vehicles</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span>Idle Vehicles</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>Offline Vehicles</span>
            </div>
          </div>
          <div className="text-xs text-gray-400">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTrackingPage;
