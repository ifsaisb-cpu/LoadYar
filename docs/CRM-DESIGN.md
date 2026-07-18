# Muslim United Car Carrier Services — CRM Design (v3, implementation-ready)

## 1. Overview

A web CRM + mobile app for a car carrier transport business based in Karachi, covering bookings, trips/loading, carrier & driver management, expenses, vendors, billing, and claims.

**Users:** office staff, drivers, and external carriers (carriers get a limited portal view of their own trips/payments only).

**Bilty entry mode:** the system supports both a **digital bilty** (created directly in the app) and a **manual/paper bilty** (existing paper workflow, later logged into the system) — a trip record has an `entry_mode` field: `digital` or `manual_logged`. Both feed the same downstream tables (expenses, billing, claims), so reporting doesn't care which path a trip came from.

## 2. Recommended Tech Stack

- **Backend + database:** Node.js (NestJS or Express) + PostgreSQL.
- **Web CRM:** React (Next.js) for the office/admin dashboard.
- **Mobile app:** React Native — offline-first entry for drivers with poor signal.
- **Auth:** role-based — admin, dispatcher, driver, carrier (external).
- **Media (photos/videos):** kept outside the CRM by design — currently on WhatsApp. The CRM only stores a text reference (e.g. "WhatsApp: Trip 50435 photos"), not the files themselves.

## 3. Module Map

```
Bookings → Trips & Loading → Trip Expenses → Finance & Reports
              ↑                    ↑
      Carriers & Drivers        Vendors

Trips → Customer Invoices → Payments Received  ─┐
Trip Expenses → Carrier/Vendor Payables → Payments Made ─┴→ Finance & Reports
```

## 4. Core Entities

### Customers (Clients)
Car manufacturers/OEMs in Pakistan (e.g. Indus Motor/Toyota, Honda Atlas, Pak Suzuki, Hyundai Nishat, Kia Lucky Motors) and their dealer network delivery points.
- Company name, plant/factory location(s), dealer delivery points, billing contact vs. operations contact.

### ClientRateAgreements
Pre-agreed rates by client + route; bookings auto-fill freight from the active agreement (manual override allowed, logged for audit).
- Client (FK), route, vehicle type/category, rate per vehicle, `valid_from`/`valid_to`, fuel surcharge clause, status.

### Bookings
- Customer (FK), booking date, route, requested pickup.

### Trips (Bilty)
- Bilty no. (auto-generated for digital; matches paper no. for manual_logged)
- `entry_mode`: digital / manual_logged
- Date, destination, consigner (client), consignee + address
- Carrier (FK), driver (FK), time of booking
- `return_load_type`: paid / empty_reposition / none — confirmed: return load is sometimes an empty repositioning leg, not always paid.
- Freight (includes the "Driving" charge — confirmed this is folded into freight, not a separate line)

### CargoVehicle
The car being transported (distinct from the carrier's own trucks).
- Make & type, chassis no., engine no., condition, colour, model, registration no. Linked to its trip.

### VehicleConditionChecklist
One row per trip per stage (pickup/delivery). Each item stores both English and Urdu labels for on-screen display.

Confirmed final list:

| # | English | Urdu |
|---|---------|------|
| 1 | Air condition | ائیر کنڈیشن |
| 2 | Heater | ہیٹر |
| 3 | Radio / tape | ریڈیو / ٹیپ |
| 4 | Speed recorder | اسپیڈ ریکارڈر |
| 5 | CD player | سی ڈی پلیئر |
| 6 | CD changer | سی ڈی چینجر |
| 7 | DVD screen | ڈی وی ڈی اسکرین |
| 8 | Spare wheel | اسپیئر وہیل |
| 9 | Jack with rod | جیک بمع راڈ |
| 10 | Remote | ریموٹ |
| 11 | Clock | گھڑی |
| 12 | Top cover | ٹاپ کور |
| 13 | Fog light | فوگ لائٹ |
| 14 | CNG kit | سی این جی کٹ |
| 15 | CNG cylinder | سی این جی سلنڈر |
| 16 | Foot mat | فٹ میٹ |
| 17 | Alloy rim | الائے رم |
| 18 | Side glass/mirror | سائیڈ گلاس |
| 19 | Wiper | وائپر |
| 20 | Keys | چابیاں |
| 21 | Dickey mat | ڈگی میٹ |
| 22 | Tool kit | پین ٹول کٹ |
| 23 | Book/manual | کتاب |
| 24 | Cigarette lighter | سگریٹ لائٹر |
| 25 | Inner glass/mirror | اندر کا شیشہ |
| 26 | Sun visor | سن وائزر |
| 27 | Seat cover | سیٹ کور |
| 28 | Nose/bonnet cover | ناپ کور |

### Carriers & Drivers
- Carrier company info, contact, `pay_type` (flat_rate / cost_plus — confirmed this depends on the carrier, so it's a per-carrier field, not global).
- Driver: name, license, contact, assigned trips.

### TripExpenses
Diesel (qty, price, odometer/location), tolls, extra delivery costs — one row per expense, linked to trip.

### ClearingAgents / ClearingAgentCharges
- Agents: name, contact, city/port.
- Charges: charge type (NOC processing — confirmed just a cost line, no document upload needed — port clearance, documentation, misc.), amount, reference/receipt no., date.

### Vendors / VendorTransactions
Tyre shops, repair shops, oil/filter suppliers — transactions linked to a specific vehicle/trip.

### Billing — Receivables
- **Invoices:** linked to trip. Confirmed: supports **both** auto-generation from trip freight data and manual entry/editing by office staff before sending.
- **Payments (incoming):** linked to invoice, partial payments supported, method, reference no.

### Billing — Payables
- **CarrierPayables:** owed to carrier — flat rate or cost-plus per the carrier's `pay_type`.
- **VendorPayables:** clearing agent / tyre / repair / oil invoices, linked to trip/vehicle.
- **Payments (outgoing):** same partial-payment logic.

### Claims
- Trip + cargo vehicle reference, claim type (damage/missing part/delay/other), description, reported by, date.
- Linked checklist item(s) — cross-references pickup vs. delivery checklist automatically.
- Claim amount, status (open/under review/settled/rejected), resolution notes.
- Cost bearer: carrier / insurance / company / client.

### TripMedia
Lightweight text reference only (confirmed: photos/videos live on WhatsApp).
- Trip reference, stage (pickup/delivery), reference text (e.g. WhatsApp group/chat name), notes.

### DocumentScan (capability, not a stored entity)
Camera-based scan to auto-fill Bilty/gate pass/consignment numbers across screens (expense entry, delivery status, claims, invoice lookup) instead of manual typing.
- **QR/barcode** (primary, near-100% accurate) — new digital bilties print a QR code encoding the trip ID alongside the human-readable number.
- **OCR text fallback** — for paper documents/gate passes without a QR code; recognized text is shown for user confirmation before it's used, since a misread digit could attach data to the wrong trip.

## 5. Implementation Decisions (resolved, v3)

### 5.1 Rate resolution — DECIDED
Freight entry is **manual by default**. If an active `ClientRateAgreement` matches (client + route + vehicle type, current date within `valid_from`/`valid_to`), the freight field **auto-fills from the contract as a suggestion**; staff may always edit/override (override logged for audit). If no agreement matches, the field is simply blank for manual entry — **no blocking, no error**. If multiple agreements overlap, use the one with the most recent `valid_from` and show a warning badge.

### 5.2 Role permissions — DECIDED

| Capability | Admin | Dispatcher | Driver (mobile) | Carrier (portal) |
|---|---|---|---|---|
| Reports & dashboard | ✅ | ❌ | ❌ | ❌ |
| Financial summaries (receivables/payables totals) | ✅ | ❌ | ❌ | ❌ |
| Bookings / trips / bilty entry | ✅ | ✅ | ❌ | ❌ |
| Invoices & payments entry | ✅ | ✅ | ❌ | ❌ |
| Trip expenses entry | ✅ | ✅ | ✅ (own trips) | ❌ |
| Vehicle condition checklist | ✅ | ✅ | ✅ (own trips) | ❌ |
| Delivery status updates | ✅ | ✅ | ✅ (own trips) | ❌ |
| Claims entry | ✅ | ✅ | ❌ | ❌ |
| Master data (clients, carriers, vendors, rates) | ✅ | ❌ | ❌ | ❌ |
| View own trips & payment status | ✅ | ✅ | ✅ (own) | ✅ (own, read-only) |

Carrier scoping is **row-level by `carrier_id`** on trips and payables. Driver scoping is row-level by assigned `driver_id`.

### 5.3 Defaults applied (override if wrong)
- **Checklist item state:** each of the 28 items stores a 3-state value — `present` / `missing` / `damaged` — plus an optional note. Claims cross-reference pickup vs. delivery states per item.
- **Invoice freight:** invoice line auto-fills from trip freight (post-override value); office staff can edit before sending; invoice edits carry their own `edited_by`/`edited_at` audit trail.
- **Currency & tax:** single currency (PKR), amounts stored as integers (paisa) or NUMERIC — no multi-currency. No tax engine; one optional flat tax/deduction line per invoice if needed.
- **Manual bilty numbers:** duplicate paper bilty numbers trigger a **warning**, not a hard block (real-world paper errors happen); digital bilty numbers are unique and auto-generated.
- **Audit columns:** every table gets `created_at`, `updated_at`, `created_by`, `updated_by`. Soft-delete (`deleted_at`) on business entities; no hard deletes from the UI.

## 6. Status

All open questions resolved. Ready for implementation via Claude Code — see `CLAUDE.md` for build conventions and module order.
