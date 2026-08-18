import React, { useRef } from 'react';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  loading: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, loading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      alert('Please select a CSV or Excel file');
      return;
    }
    onFileSelect(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload File</h2>

      {/* Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="border-2 border-dashed border-blue-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
      >
        <svg
          className="mx-auto h-12 w-12 text-blue-500 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        <p className="text-lg font-medium text-gray-900 mb-1">Drop CSV/Excel file here</p>
        <p className="text-sm text-gray-600 mb-4">or click to select</p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx"
          onChange={handleInputChange}
          className="hidden"
          disabled={loading}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Uploading...' : 'Select File'}
        </button>
      </div>

      {/* Templates */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Download Template</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['customers', 'carriers', 'vehicles', 'rates'].map((type) => (
            <a
              key={type}
              href={`/api/v1/import/template/${type}`}
              download={`${type}_template.csv`}
              className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg text-center hover:bg-gray-200 text-sm font-medium"
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FileUploader;
