import React from 'react';
import { ErrorReport } from './ErrorReport';

interface SuccessSummaryProps {
  successful_rows: number;
  failed_rows: number;
  total_rows: number;
  errors: Array<{
    row_number: number;
    field_name: string;
    error_message: string;
    error_code: string;
  }>;
  onStartOver: () => void;
}

export const SuccessSummary: React.FC<SuccessSummaryProps> = ({
  successful_rows,
  failed_rows,
  total_rows,
  errors,
  onStartOver,
}) => {
  const successPercentage = Math.round((successful_rows / total_rows) * 100);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Import Complete</h2>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-sm text-green-600 mb-1">Successful</p>
          <p className="text-3xl font-bold text-green-900">{successful_rows}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <p className="text-sm text-red-600 mb-1">Failed</p>
          <p className="text-3xl font-bold text-red-900">{failed_rows}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-600 mb-1">Success Rate</p>
          <p className="text-3xl font-bold text-blue-900">{successPercentage}%</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            style={{ width: `${successPercentage}%` }}
            className="bg-green-600 h-3 transition-all duration-500"
          ></div>
        </div>
      </div>

      {/* Errors (if any) */}
      {errors.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Errors</h3>
          <ErrorReport errors={errors} />
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={onStartOver}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Import More Data
        </button>
        <a
          href="/dashboard"
          className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
};

export default SuccessSummary;
