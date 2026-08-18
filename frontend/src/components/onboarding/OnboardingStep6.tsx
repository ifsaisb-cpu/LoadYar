import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export const OnboardingStep6: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleActivate = async () => {
    setLoading(true);
    setError('');

    try {
      await axios.post('/api/v1/onboarding/activate');

      // Show success and redirect
      setTimeout(() => {
        navigate('/dashboard', {
          state: { message: 'Onboarding complete! Welcome to LoadYar.' },
        });
      }, 2000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to activate account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Review & Activate</h2>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Checklist */}
      <div className="space-y-3 mb-8">
        <div className="flex items-center p-3 bg-green-50 rounded-lg">
          <span className="text-green-600 font-bold mr-3">✓</span>
          <span className="text-gray-900">Company information configured</span>
        </div>
        <div className="flex items-center p-3 bg-green-50 rounded-lg">
          <span className="text-green-600 font-bold mr-3">✓</span>
          <span className="text-gray-900">Vehicles added to fleet</span>
        </div>
        <div className="flex items-center p-3 bg-green-50 rounded-lg">
          <span className="text-green-600 font-bold mr-3">✓</span>
          <span className="text-gray-900">Drivers registered</span>
        </div>
        <div className="flex items-center p-3 bg-green-50 rounded-lg">
          <span className="text-green-600 font-bold mr-3">✓</span>
          <span className="text-gray-900">Rate cards configured</span>
        </div>
        <div className="flex items-center p-3 bg-green-50 rounded-lg">
          <span className="text-green-600 font-bold mr-3">✓</span>
          <span className="text-gray-900">Chart of accounts ready</span>
        </div>
      </div>

      {/* Activation Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <p className="text-blue-900">
          Once activated, your LoadYar account will be live and ready to use. You can start creating
          bookings, tracking trips, and managing your operations immediately.
        </p>
      </div>

      {/* Activate Button */}
      <button
        onClick={handleActivate}
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 text-lg"
      >
        {loading ? 'Activating...' : '🚀 Activate My Account'}
      </button>

      {/* Success Message */}
      {!error && loading && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
          <p className="text-green-800">Activating your account...</p>
        </div>
      )}
    </div>
  );
};

export default OnboardingStep6;
