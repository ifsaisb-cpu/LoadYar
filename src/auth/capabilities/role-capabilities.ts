import { Role } from '../../../generated/prisma/client';
import { Capability } from './capability.enum';

// Design doc §5.2, verbatim. Driver/carrier "own" restrictions are enforced
// additionally in the query layer via row-level scoping (see row-scope.ts) —
// this map only answers "may this role touch this feature at all".
export const ROLE_CAPABILITIES: Record<Role, ReadonlySet<Capability>> = {
  admin: new Set([
    Capability.REPORTS_DASHBOARD,
    Capability.FINANCIAL_SUMMARIES,
    Capability.BOOKINGS_TRIPS_ENTRY,
    Capability.INVOICES_PAYMENTS_ENTRY,
    Capability.TRIP_EXPENSES_ENTRY,
    Capability.CHECKLIST_ENTRY,
    Capability.DELIVERY_STATUS_UPDATE,
    Capability.CLAIMS_ENTRY,
    Capability.MASTER_DATA,
    Capability.VIEW_OWN_TRIPS_PAYMENTS,
  ]),
  dispatcher: new Set([
    Capability.BOOKINGS_TRIPS_ENTRY,
    Capability.INVOICES_PAYMENTS_ENTRY,
    Capability.TRIP_EXPENSES_ENTRY,
    Capability.CHECKLIST_ENTRY,
    Capability.DELIVERY_STATUS_UPDATE,
    Capability.CLAIMS_ENTRY,
    Capability.VIEW_OWN_TRIPS_PAYMENTS,
  ]),
  driver: new Set([
    Capability.TRIP_EXPENSES_ENTRY,
    Capability.CHECKLIST_ENTRY,
    Capability.DELIVERY_STATUS_UPDATE,
    Capability.VIEW_OWN_TRIPS_PAYMENTS,
  ]),
  carrier: new Set([Capability.VIEW_OWN_TRIPS_PAYMENTS]),
};

export function roleHasCapability(role: Role, capability: Capability): boolean {
  return ROLE_CAPABILITIES[role].has(capability);
}
