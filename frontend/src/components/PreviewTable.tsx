import React from 'react';

interface PreviewTableProps {
  rows: Array<Record<string, any>>;
}

export const PreviewTable: React.FC<PreviewTableProps> = ({ rows }) => {
  if (!rows || rows.length === 0) {
    return <p className="text-gray-600">No data to preview</p>;
  }

  const headers = Object.keys(rows[0]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            {headers.map((header) => (
              <th key={header} className="border p-2 text-left text-sm font-semibold text-gray-900">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              {headers.map((header) => (
                <td key={`${idx}-${header}`} className="border p-2 text-sm text-gray-600">
                  {row[header] || '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PreviewTable;
