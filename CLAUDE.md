# Muslim United CRM — Project Conventions for Claude Code

Read `docs/CRM-DESIGN.md` in full before implementing anything. It is the source of truth. Section 5 contains resolved implementation decisions — do not re-ask those; do ask before deviating.

## Stack (fixed)
- Backend: NestJS + PostgreSQL, Prisma ORM
- Web CRM: Next.js (App Router) + React
- Mobile: React Native (Expo), offline-first for drivers (local SQLite queue, sync on connectivity)
- Auth: JWT sessions, role-based — roles: `admin`, `dispatcher`, `driver`, `carrier`

## Non-negotiable rules
- Enums (`entry_mode`, `pay_type`, `return_load_type`, checklist item state, claim status, cost bearer) are Postgres enums via Prisma, never free-text strings.
- Every table: `created_at`, `updated_at`, `created_by`, `updated_by`. Business entities also get `deleted_at` (soft delete). No hard deletes exposed in any API.
- Money: PKR only, stored as `NUMERIC(14,2)`. No floats for currency, ever.
- Permissions follow the matrix in design doc §5.2 exactly. Dispatcher and driver have **no access** to reports/dashboards/financial summaries — enforce server-side (guards), not just in the UI.
- Carrier and driver data access is row-level scoped (`carrier_id` / `driver_id`) — enforce in query layer, not just route guards.
- Checklist: 28 fixed items seeded from design doc §4 table, with English + Urdu labels stored in DB; UI renders both.
- Rate auto-fill: suggestion only, always editable, overrides logged (design doc §5.1).
- Manual bilty duplicate numbers: warn, don't block.
- Media: text references only (WhatsApp pointer). Never build file upload/storage for trip photos.

## Build order (one module per session; don't skip ahead)
1. Prisma schema + migrations for all core entities (§4) — get this reviewed before writing any API code
2. Auth + roles + row-level scoping
3. Customers, ClientRateAgreements, Carriers & Drivers, Vendors, ClearingAgents (master data + CRUD)
4. Bookings → Trips/Bilty (both entry modes) + CargoVehicle + VehicleConditionChecklist
5. TripExpenses + VendorTransactions + ClearingAgentCharges
6. Billing: Invoices + incoming payments; CarrierPayables/VendorPayables + outgoing payments (partial payments both sides)
7. Claims (with pickup-vs-delivery checklist cross-reference)
8. Reports & admin dashboard
9. Mobile app (driver flows: checklist, expenses, delivery status, offline sync)
10. QR/barcode scan + OCR fallback (scan-to-fill across screens)

## Working style
- After each module: run migrations, seed minimal test data, write at least happy-path tests for services and permission guards.
- If the design doc is ambiguous on something not covered in §5, state your assumption in the PR/summary and proceed — don't silently guess without noting it.
- Keep commits scoped per module.
