import React from 'react';

interface BillingStatusProps {
  status: string;
  plan: string;
  monthlyFee: number;
}

export const BillingStatus: React.FC<BillingStatusProps> = ({
  status,
  plan,
  monthlyFee,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'trial':
        return 'bg-blue-100 text-blue-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(status)}`}>
          {getStatusLabel(status)}
        </span>
        <span className="text-sm text-gray-600">
          {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
        </span>
      </div>
      <span className="text-sm font-medium text-gray-900">
        ₨{monthlyFee.toLocaleString()}/mo
      </span>
    </div>
  );
};

export default BillingStatus;
