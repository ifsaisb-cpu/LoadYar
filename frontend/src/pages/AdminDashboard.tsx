import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TenantCard } from '../components/TenantCard';

interface Tenant {
  id: number;
  name: string;
  created_at: string;
  subscription?: {
    status: string;
    plan: string;
    monthly_fee: number;
    next_due_at?: string;
  };
}

interface AdminDashboardProps {
  isAdmin?: boolean;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ isAdmin = true }) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalTenants, setTotalTenants] = useState(0);
  const [page, setPage] = useState(0);
  const [perPage] = useState(10);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');

  // Fetch tenants
  useEffect(() => {
    fetchTenants();
  }, [page]);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/v1/tenants', {
        params: {
          limit: perPage,
          offset: page * perPage,
        },
      });

      setTenants(response.data.tenants);
      setTotalTenants(response.data.total);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setShowSuspendModal(true);
  };

  const confirmSuspend = async () => {
    if (!selectedTenant) return;

    try {
      await axios.patch(`/api/v1/tenants/${selectedTenant.id}/suspend`, {
        reason: suspendReason,
      });

      setShowSuspendModal(false);
      setSuspendReason('');
      setSelectedTenant(null);
      fetchTenants();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to suspend tenant');
    }
  };

  const handleReactivate = async (tenant_id: number) => {
    try {
      await axios.patch(`/api/v1/tenants/${tenant_id}/reactivate`);
      fetchTenants();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to reactivate tenant');
    }
  };

  const totalPages = Math.ceil(totalTenants / perPage);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage all client tenants</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm font-medium">Total Tenants</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{totalTenants}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm font-medium">Active Tenants</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {tenants.filter((t) => t.subscription?.status === 'active').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-600 text-sm font-medium">Trial Tenants</h3>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {tenants.filter((t) => t.subscription?.status === 'trial').length}
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Tenant List */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading tenants...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tenants.map((tenant) => (
                <TenantCard
                  key={tenant.id}
                  tenant={tenant}
                  onSuspend={() => handleSuspend(tenant)}
                  onReactivate={() => handleReactivate(tenant.id)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <p className="text-gray-600">
                  Page {page + 1} of {totalPages}
                </p>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Suspend Modal */}
        {showSuspendModal && selectedTenant && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Suspend Tenant?</h2>
              <p className="text-gray-600 mb-4">
                Are you sure you want to suspend <strong>{selectedTenant.name}</strong>?
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason (optional)
                </label>
                <textarea
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="e.g., Overdue payment"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowSuspendModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSuspend}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Suspend
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
