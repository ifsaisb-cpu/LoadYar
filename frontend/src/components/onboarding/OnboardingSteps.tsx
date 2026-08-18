import React, { useState } from 'react';
import axios from 'axios';

// ===== STEP 2: VEHICLES =====

interface OnboardingStep2Props {
  onComplete: () => void;
}

export const OnboardingStep2: React.FC<OnboardingStep2Props> = ({ onComplete }) => {
  const [vehicles, setVehicles] = useState([
    { plate_number: '', make_model: '', capacity_kg: 5000 },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVehicleChange = (idx: number, field: string, value: any) => {
    const newVehicles = [...vehicles];
    newVehicles[idx] = { ...newVehicles[idx], [field]: value };
    setVehicles(newVehicles);
  };

  const handleAddVehicle = () => {
    setVehicles([...vehicles, { plate_number: '', make_model: '', capacity_kg: 5000 }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post('/api/v1/onboarding/step/2/vehicles', { vehicles });
      onComplete();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to save vehicles');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Add your vehicles</h2>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        {vehicles.map((vehicle, idx) => (
          <div key={idx} className="p-4 border border-gray-200 rounded-lg space-y-4">
            <h3 className="font-medium text-gray-900">Vehicle {idx + 1}</h3>
            <input
              type="text"
              placeholder="License Plate (e.g., ABC-123)"
              value={vehicle.plate_number}
              onChange={(e) => handleVehicleChange(idx, 'plate_number', e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="text"
              placeholder="Make/Model (e.g., Hino 500)"
              value={vehicle.make_model}
              onChange={(e) => handleVehicleChange(idx, 'make_model', e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="number"
              placeholder="Capacity (kg)"
              value={vehicle.capacity_kg}
              onChange={(e) => handleVehicleChange(idx, 'capacity_kg', parseInt(e.target.value))}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={handleAddVehicle}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
        >
          + Add Another Vehicle
        </button>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save & Continue'}
        </button>
      </form>
    </div>
  );
};

// ===== STEP 3: DRIVERS =====

interface OnboardingStep3Props {
  onComplete: () => void;
}

export const OnboardingStep3: React.FC<OnboardingStep3Props> = ({ onComplete }) => {
  const [drivers, setDrivers] = useState([
    { name: '', email: '', phone: '', license_number: '' },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDriverChange = (idx: number, field: string, value: string) => {
    const newDrivers = [...drivers];
    newDrivers[idx] = { ...newDrivers[idx], [field]: value };
    setDrivers(newDrivers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post('/api/v1/onboarding/step/3/drivers', { drivers });
      onComplete();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to save drivers');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Add your drivers</h2>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        {drivers.map((driver, idx) => (
          <div key={idx} className="p-4 border border-gray-200 rounded-lg space-y-4">
            <h3 className="font-medium text-gray-900">Driver {idx + 1}</h3>
            <input
              type="text"
              placeholder="Full Name"
              value={driver.name}
              onChange={(e) => handleDriverChange(idx, 'name', e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="email"
              placeholder="Email"
              value={driver.email}
              onChange={(e) => handleDriverChange(idx, 'email', e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="tel"
              placeholder="Phone"
              value={driver.phone}
              onChange={(e) => handleDriverChange(idx, 'phone', e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            <input
              type="text"
              placeholder="License Number"
              value={driver.license_number}
              onChange={(e) => handleDriverChange(idx, 'license_number', e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        ))}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save & Continue'}
        </button>
      </form>
    </div>
  );
};

// ===== STEP 4: RATES =====

interface OnboardingStep4Props {
  onComplete: () => void;
}

export const OnboardingStep4: React.FC<OnboardingStep4Props> = ({ onComplete }) => {
  const [rates, setRates] = useState([
    { origin_city: '', destination_city: '', rate_pkr: 0 },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRateChange = (idx: number, field: string, value: any) => {
    const newRates = [...rates];
    newRates[idx] = { ...newRates[idx], [field]: value };
    setRates(newRates);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post('/api/v1/onboarding/step/4/rates', { rates });
      onComplete();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to save rates');
    } finally {
      setLoading(false);
    }
  };

  const cities = ['Islamabad', 'Lahore', 'Karachi', 'Rawalpindi', 'Multan', 'Faisalabad'];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Set your rates</h2>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        {rates.map((rate, idx) => (
          <div key={idx} className="p-4 border border-gray-200 rounded-lg space-y-4">
            <h3 className="font-medium text-gray-900">Rate {idx + 1}</h3>
            <select
              value={rate.origin_city}
              onChange={(e) => handleRateChange(idx, 'origin_city', e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Origin City</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <select
              value={rate.destination_city}
              onChange={(e) => handleRateChange(idx, 'destination_city', e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Destination City</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Rate (PKR)"
              value={rate.rate_pkr}
              onChange={(e) => handleRateChange(idx, 'rate_pkr', parseFloat(e.target.value))}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        ))}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save & Continue'}
        </button>
      </form>
    </div>
  );
};

// ===== STEP 5: GL ACCOUNTS =====

interface OnboardingStep5Props {
  onComplete: () => void;
}

export const OnboardingStep5: React.FC<OnboardingStep5Props> = ({ onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post('/api/v1/onboarding/step/5/gl-accounts', {});
      onComplete();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to save GL settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Chart of Accounts</h2>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
        <p className="text-blue-900">
          Your default Chart of Accounts has been set up with 76 GL accounts for Pakistani
          compliance (SRB, WHT, etc.). You can customize these later in the GL Accounts section.
        </p>
      </div>
      <form onSubmit={handleSubmit}>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Continue'}
        </button>
      </form>
    </div>
  );
};
