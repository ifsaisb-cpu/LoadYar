import React from 'react';

interface ProgressBarProps {
  progress: number; // 0-100
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
  return (
    <div className="mb-8">
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">Setup Progress</span>
        <span className="text-sm font-medium text-gray-700">{progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          style={{ width: `${progress}%` }}
          className="bg-blue-600 h-3 transition-all duration-500"
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;
