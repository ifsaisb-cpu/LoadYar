import React, { useState } from 'react';
import axios from 'axios';
import { FileUploader } from '../components/FileUploader';
import { PreviewTable } from '../components/PreviewTable';
import { ErrorReport } from '../components/ErrorReport';
import { SuccessSummary } from '../components/SuccessSummary';

type Step = 'upload' | 'preview' | 'validate' | 'import' | 'complete';

interface ImportState {
  job_id?: number;
  entity_type?: string;
  total_rows?: number;
  successful_rows?: number;
  failed_rows?: number;
  preview_rows?: Array<Record<string, any>>;
  errors?: Array<{
    row_number: number;
    field_name: string;
    error_message: string;
    error_code: string;
  }>;
}

export const ImportWizard: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [importState, setImportState] = useState<ImportState>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ===== STEP 1: UPLOAD =====
  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post('/api/v1/import/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setImportState({
        job_id: response.data.job_id,
        entity_type: response.data.entity_type,
        total_rows: response.data.total_rows,
        preview_rows: response.data.preview_rows,
      });

      setCurrentStep('preview');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  // ===== STEP 2: PREVIEW =====
  const handlePreviewConfirm = () => {
    setCurrentStep('validate');
  };

  const handlePreviewBack = () => {
    setCurrentStep('upload');
  };

  // ===== STEP 3: VALIDATE & IMPORT =====
  const handleExecuteImport = async () => {
    if (!importState.job_id) return;

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`/api/v1/import/${importState.job_id}/execute`);

      setImportState({
        ...importState,
        successful_rows: response.data.successful_rows,
        failed_rows: response.data.failed_rows,
        errors: response.data.errors,
      });

      setCurrentStep('complete');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Import failed');
      setCurrentStep('validate');
    } finally {
      setLoading(false);
    }
  };

  // ===== STEP 4: COMPLETE =====
  const handleStartOver = () => {
    setCurrentStep('upload');
    setImportState({});
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Data Import Wizard</h1>
          <p className="text-gray-600 mt-2">Import customers, carriers, vehicles, and rates from CSV</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {['upload', 'preview', 'validate', 'import', 'complete'].map((step, idx) => (
              <div key={step} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    ['upload', 'preview', 'validate', 'import', 'complete'].indexOf(currentStep) >=
                    idx
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {idx + 1}
                </div>
                {idx < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      ['upload', 'preview', 'validate', 'import', 'complete'].indexOf(currentStep) >
                      idx
                        ? 'bg-blue-600'
                        : 'bg-gray-300'
                    }`}
                  ></div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Upload</span>
            <span>Preview</span>
            <span>Validate</span>
            <span>Import</span>
            <span>Complete</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-lg shadow p-8">
          {currentStep === 'upload' && (
            <FileUploader onFileSelect={handleFileUpload} loading={loading} />
          )}

          {currentStep === 'preview' && importState.preview_rows && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Preview Data</h2>
              <p className="text-gray-600 mb-4">
                {importState.entity_type}: {importState.total_rows} rows
              </p>
              <PreviewTable rows={importState.preview_rows} />
              <div className="flex gap-4 mt-8">
                <button
                  onClick={handlePreviewBack}
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Back
                </button>
                <button
                  onClick={handlePreviewConfirm}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {currentStep === 'validate' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Validate & Import</h2>
              <p className="text-gray-600 mb-6">
                Ready to import {importState.total_rows} rows of {importState.entity_type}?
              </p>
              <button
                onClick={handleExecuteImport}
                disabled={loading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Importing...' : 'Execute Import'}
              </button>
            </div>
          )}

          {currentStep === 'complete' && (
            <SuccessSummary
              successful_rows={importState.successful_rows || 0}
              failed_rows={importState.failed_rows || 0}
              total_rows={importState.total_rows || 0}
              errors={importState.errors || []}
              onStartOver={handleStartOver}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportWizard;
