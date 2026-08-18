import { apiClient } from './api';

export const exportAnalytics = async (
  tenantId: number,
  reportType: 'trips' | 'drivers' | 'revenue' | 'customers',
  startDate: Date,
  endDate: Date,
) => {
  try {
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    const response = await apiClient.get('/analytics/export', {
      params: {
        tenant_id: tenantId,
        report_type: reportType,
        start_date: formatDate(startDate),
        end_date: formatDate(endDate),
      },
    });

    // Convert to CSV
    const csv = convertToCSV(response.data, reportType);

    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Export failed:', error);
    alert('Failed to export report');
  }
};

const convertToCSV = (data: any, reportType: string): string => {
  if (!Array.isArray(data)) {
    data = [data];
  }

  if (data.length === 0) {
    return 'No data available';
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value;
        })
        .join(','),
    ),
  ].join('\n');

  return csvContent;
};
