// One capability per row of the design doc §5.2 permission matrix.
export enum Capability {
  REPORTS_DASHBOARD = 'reports_dashboard',
  FINANCIAL_SUMMARIES = 'financial_summaries',
  BOOKINGS_TRIPS_ENTRY = 'bookings_trips_entry',
  INVOICES_PAYMENTS_ENTRY = 'invoices_payments_entry',
  TRIP_EXPENSES_ENTRY = 'trip_expenses_entry',
  CHECKLIST_ENTRY = 'checklist_entry',
  DELIVERY_STATUS_UPDATE = 'delivery_status_update',
  CLAIMS_ENTRY = 'claims_entry',
  MASTER_DATA = 'master_data',
  VIEW_OWN_TRIPS_PAYMENTS = 'view_own_trips_payments',
}
