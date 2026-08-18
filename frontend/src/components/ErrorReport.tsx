import React, { useState } from 'react';

interface Error {
  row_number: number;
  field_name: string;
  error_message: string;
  error_code: string;
}

interface ErrorReportProps {
  errors: Error[];
}

export const ErrorReport: React.FC<ErrorReportProps> = ({ errors }) => {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  if (!errors || errors.length === 0) {
    return <p className="text-green-600 font-medium">No errors found!</p>;
  }

  const toggleRow = (rowNumber: number) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(rowNumber)) {
      newSet.delete(rowNumber);
    } else {
      newSet.add(rowNumber);
    }
    setExpandedRows(newSet);
  };

  const errorsByRow = errors.reduce(
    (acc, error) => {
      if (!acc[error.row_number]) {
        acc[error.row_number] = [];
      }
      acc[error.row_number].push(error);
      return acc;
    },
    {} as Record<number, Error[]>,
  );

  return (
    <div className="space-y-2">
      <p className="text-red-600 font-medium mb-4">{errors.length} errors found</p>
      {Object.entries(errorsByRow).map(([rowNumber, rowErrors]) => (
        <div key={rowNumber} className="border rounded-lg overflow-hidden">
          <button
            onClick={() => toggleRow(Number(rowNumber))}
            className="w-full p-3 bg-red-50 hover:bg-red-100 flex justify-between items-center text-left"
          >
            <span className="font-medium text-red-900">
              Row {rowNumber} ({rowErrors.length} error{rowErrors.length !== 1 ? 's' : ''})
            </span>
            <span className="text-red-600">{expandedRows.has(Number(rowNumber)) ? '▼' : '▶'}</span>
          </button>
          {expandedRows.has(Number(rowNumber)) && (
            <div className="p-3 bg-white border-t space-y-2">
              {rowErrors.map((error, idx) => (
                <div key={idx} className="text-sm">
                  <p className="font-medium text-gray-900">{error.field_name}</p>
                  <p className="text-gray-600">{error.error_message}</p>
                  <span className="inline-block mt-1 px-2 py-1 bg-red-100 text-red-800 text-xs rounded">
                    {error.error_code}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ErrorReport;
