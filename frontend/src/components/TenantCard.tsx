import React from 'react';
import { BillingStatus } from './BillingStatus';

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

interface TenantCardProps {
  tenant: Tenant;
  onSuspend?: () => void;
  onReactivate?: () => void;
}

export const TenantCard: React.FC<TenantCardProps> = ({
  tenant,
  onSuspend,
  onReactivate,
}) => {
  const subscription = tenant.subscription;
  const createdDate = new Date(tenant.created_at).toLocaleDateString();

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-6">
      {/* Tenant Name */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">{tenant.name}</h3>
        <p className="text-sm text-gray-500 mt-1">ID: {tenant.id}</p>
      </div>

      {/* Billing Status */}
      {subscription && (
        <div className="mb-4">
          <BillingStatus
            status={subscription.status}
            plan={subscription.plan}
            monthlyFee={subscription.monthly_fee}
          />
        </div>
      )}

      {/* Details */}
      <div className="space-y-2 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Created:</span>
          <span className="text-gray-900 font-medium">{createdDate}</span>
        </div>
        {subscription?.next_due_at && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Next Due:</span>
            <span className="text-gray-900 font-medium">
              {new Date(subscription.next_due_at).toLocaleDateString()}
            </span>
          </div>
        )}
        {subscription?.monthly_fee && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Monthly Fee:</span>
            <span className="text-gray-900 font-medium">
              ₨{subscription.monthly_fee.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {subscription?.status === 'active' && (
          <button
            onClick={onSuspend}
            className="flex-1 px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-medium hover:bg-yellow-200 transition"
          >
            Suspend
          </button>
        )}
        {subscription?.status === 'suspended' && (
          <button
            onClick={onReactivate}
            className="flex-1 px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium hover:bg-green-200 transition"
          >
            Reactivate
          </button>
        )}
        <button className="flex-1 px-3 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium hover:bg-blue-200 transition">
          View Details
        </button>
      </div>
    </div>
  );
};

export default TenantCard;
