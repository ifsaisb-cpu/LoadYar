# Pakistani TMS Market Research — Findings

**Date:** 18/7/2026
**Purpose:** Region-specific research for building a Transport Management System (TMS) for a Karachi-based goods transport client. Focus is exclusively on the Pakistani market — its terminology, paper forms, workflows, and what local transporters actually want — not generic global TMS features.

> Items marked *(industry practice — verify with client)* are well-known trade conventions that were not fully documented in online sources; confirm the client's exact variant during requirements sessions.

---

## 1. Market landscape — who serves Pakistani transporters today

### 1.1 Pakistan-focused TMS products

| Product | Base | Positioning | Notable Pakistan-specific features |
|---|---|---|---|
| **Fleetable** (fleetable.tech/en-pk) | Karachi office | Full TMS for mid/large transporters; the closest "benchmark" product | PKR billing throughout; consignment-note (bilty) generation; FTL + Part-load (LTL) modules; freight-broker module with commission/margin tracking; driver app with advance issuance, on-road expense logging (fuel, tolls, meals) and trip-closure settlement; NHA axle-weight compliance in load planning; references CPEC corridors, M-9/N-55 routes, Karachi Port/Port Qasim flows; WhatsApp + SMS milestone notifications; multi-branch live dashboards; digital POD (signature/photo) |
| **Bilty Management System** (TechnoVaders, bilty.technovaders.com) | Pakistan | Small goods-transport & warehouse businesses | Deliberately **register-like UI** "closer to the prevalent paper sheets"; bilty + booking registers; per-customer bilty/dues/credit history; **English + Urdu invoices**; QR-coded invoices/receipts; audit trails; WhatsApp-based support |
| **Cargo Management System** (Software Linkers) | Islamabad | Desktop app, lifetime license (~PKR 100,000 / $350) | Bilty register (bilty no., customer, mobile, address); income/expense books; staff & salaries; Excel/print reports; daily backup to local drive + Google Drive; Urdu tutorial videos; WhatsApp support |
| **TruckLoad.pk / truckada.pk / SastaLoad** | Pakistan | Online truck booking / spot-rate marketplaces | Daily **spot rates** Karachi → major cities for 20/40-ft containers, 18- and 22-wheelers; online booking + tracking ID |

### 1.2 Digital freight startups (marketplace model, not seller of TMS — but they set user expectations)

| Company | Base | Model |
|---|---|---|
| **Trukkr** | Karachi | TMS + fintech for small/medium trucking companies; ~20,000 drivers; serves Shan Foods, Lucky Cement etc.; NBFC lending license — **freight financing is a real pain point** (transporters wait 30–90 days for payment) |
| **BridgeLinx** | Lahore | Digital freight marketplace (Pakistan's largest seed round, $10M); shipper↔carrier matching, quotations, live tracking, loading/unloading notifications, all shipment documents in-app; clients in textiles, cement, agriculture, exports |
| **Truck It In** | Karachi | Road-freight load-matching, booking, dispatching; agriculture, steel, coal, construction sectors |

### 1.3 Indian bilty software (frequently found in searches — treat as *anti*-references)

Builty.in, bilty.software, OnlineLR, mybilty.com etc. dominate search results but are built around **Indian compliance: GST, GSTIN, e-way bills, LR (Lorry Receipt) numbering**. Pakistan has **no e-way bill system and no GSTIN** — a Pakistani TMS must not carry these concepts. Useful only for form-field inspiration since the bilty document itself is shared subcontinental heritage.

**Market gap:** between the cheap desktop bilty registers (no mobile, no multi-branch, no driver app) and Fleetable (full-suite, sales-contact pricing), there is room for a modern web + mobile product that keeps the *register mentality* small transporters trust while adding driver apps, WhatsApp flows, and proper ledgers. That is effectively the product this project is building.

---

## 2. Terminology glossary (Pakistan / Karachi trade usage)

The system's UI and DB should use these terms — with Urdu labels alongside English, as competitor products do.

| Term | Urdu | Meaning in Pakistani trucking |
|---|---|---|
| **Bilty / Builty** | بلٹی | The consignment note / goods receipt — *the* central document. Issued by the transport company when goods are booked/loaded. Serves as receipt, contract of carriage, and the claim document the consignee presents to take delivery. Both spellings appear; "bilty" is the common one. |
| **Consignor** | بھیجنے والا / مرسل | Sender of goods (often called "party" colloquially) |
| **Consignee** | وصول کنندہ / مرسل الیہ | Receiver; delivery is released against their copy of the bilty (or ID/authority letter) |
| **Kiraya / Bhada** | کرایہ / بھاڑا | Freight charge |
| **Paid / To-Pay bilty** | — | Payment mode of the bilty: freight **paid** by consignor at booking, **to-pay** (collected from consignee at destination), or **account/credit** (monthly billing for regular clients). Core field on every bilty. *(industry practice — verify client's exact modes)* |
| **Advance / Baqaya** | ایڈوانس / بقایا | Part-payment at booking; remaining balance. Partial payments are the norm, both from customers and to carriers/drivers |
| **Munshi** | منشی | The clerk/booking agent at the adda who writes bilties, hires trucks, keeps registers |
| **Munshiana** | منشیانہ | The munshi's/adda's fixed commission per booking, deducted from freight when hiring a third-party vehicle. Poorly documented online but universally used at addas *(industry practice — verify amount/handling with client)* |
| **Adda** | اڈا | Truck stand / transport yard where vehicles are hired and goods booked |
| **Kata / Kanta** | کانٹا | Weighbridge; "kata weight" (first/second weighment) is often the billing basis for bulk cargo *(industry practice — verify)* |
| **Hamali / Mazdoori** | حمالی / مزدوری | Loading/unloading labour charges — shown as a separate line on the bilty |
| **Halting / Demurrage** | ہالٹنگ | Per-day charge when vehicle is detained at loading/unloading beyond free time, or consignee delays taking delivery |
| **Bilty number / GR number** | — | Serial number from pre-printed bilty books (per branch/book series). Manual books mean **duplicate numbers happen** — warn, don't block (already a project rule) |
| **Khata** | کھاتہ | Running ledger — per customer, per carrier, per broker. The paper khata is what the software's ledger screens must replace |
| **Broker / Commission agent** | بروکر | Middleman who arranges vehicles or loads for a cut; commission tracking is a first-class need |
| **Delivery Order (DO)** | — | Release order at destination godown/port against which goods are handed over *(verify if client uses)* |
| **Chalan / Gate pass** | چالان | Dispatch/outgoing document at factory or godown gate |
| **Rawangi / Pohanch** | روانگی / پہنچ | Departure / arrival — common register column headings *(industry practice)* |

### Vehicle types (the de-facto "fleet vocabulary" in Karachi)

Rate lists and booking screens should offer these as vehicle classes, not free text:

- **Suzuki (Ravi/pickup)** — ~1 ton, intra-city
- **Shehzore** — 1.5–2 tons, 9–12 ft deck; the workhorse for Karachi local shifting
- **Mazda** — 3–7 tons (commonly 16/17/20-ft body variants)
- **6-wheeler / 10-wheeler trucks** — mid/heavy inter-city
- **20-ft / 40-ft container trucks**
- **18-wheeler / 22-wheeler trailers (flatbed)** — heavy inter-city, port-to-upcountry
- **Oil tankers / dumpers / low-beds** — specialized *(offer as extensible list)*

Routes are quoted **city-to-city with vehicle type** (e.g., "Karachi → Lahore, 22-wheeler flatbed") and fluctuate as daily **spot rates**; return-load ("wapsi") rates are lower than outbound. This matches the project's rate-agreement + editable auto-fill design.

---

## 3. The bilty form — anatomy

Synthesized from Fleetable's glossary, bilty format references, and printed Pakistani bilty samples:

**Header:** transporter name/logo, branch addresses & phone numbers, bilty serial number (pre-printed), date, origin → destination.

**Parties:** consignor name/address/phone; consignee name/address/phone (phone numbers matter — delivery is coordinated by phone/WhatsApp).

**Goods:** description (often in Urdu), number of packages (nag / نگ — count of parcels), packing type (bags/bundles/drums/loose), weight (actual + chargeable, kata weight where applicable), declared value (for claims).

**Charges (each a separate line):** freight (kiraya), hamali/mazdoori, bilty/documentation fee, delivery charges, insurance (rare), other; **total**; **payment mode: Paid / To-Pay / Account**; advance received and balance.

**Transport side:** vehicle number, driver name & phone & CNIC, carrier/owner name if hired vehicle.

**Footer:** terms & conditions in Urdu (liability limits, "goods loaded at owner's risk", demurrage terms), signatures/stamps of munshi and driver.

**Copies:** typically 3–4 — consignor copy, consignee copy (presented to collect goods), office/record copy, and often a driver/vehicle copy. *(verify client's copy count and colour convention)*

**Implication for the system:** the printed bilty must be bilingual (English + Urdu), work on pre-printed stationery as well as plain A4/A5 with QR code, and the number field must accept manual book numbers with duplicate-warning (already in project rules).

---

## 4. How the business actually works — workflows to support

1. **Booking:** customer calls/WhatsApps or walks in → munshi records booking (goods, route, vehicle class, agreed rate). Two entry realities: company's own/contracted vehicle, or **hire from the adda** (find truck via broker, negotiate spot rate, pay advance to owner-driver, deduct munshiana/commission).
2. **Loading:** vehicle to warehouse/factory/port → kata weighment for bulk → bilty written per consignment (one truck may carry multiple bilties in part-load) → gate pass/chalan collected.
3. **Transit:** phone-call tracking traditionally; modern expectation is GPS or driver-app status + **WhatsApp notifications to customer** (booking, departure, arrival, delivery) — Fleetable and BridgeLinx both lead with this.
4. **Delivery & POD:** consignee's copy surrendered / signed bilty returned as POD. Signed-bilty return to origin office is the trigger for billing account customers *(industry practice)*. Modern: photo of signed bilty + signature in driver app.
5. **Money — the hard part and the real product:**
   - **Customer side:** to-pay collections by driver, advances, monthly invoices for account parties, **partial payments and aging** — recovery ("wasooli") tracking is the #1 daily activity.
   - **Carrier side:** advance at loading (commonly a large % of freight), balance after signed-bilty/POD return, deductions (shortage/damage, late delivery, munshiana).
   - **Driver side (own fleet):** trip advance, on-road expenses (diesel, tolls/M-tag, kata fees, challans, food), settlement at trip close — Fleetable's driver-advance/settlement loop is exactly this.
   - Everything runs on **khata (running ledgers)** per customer/carrier/broker, not clean invoice-per-trip settlement. Ledger-first accounting with partial payments on both sides is non-negotiable.
6. **Claims:** shortage/damage disputes settled by deduction from freight or from carrier balance, referencing loading vs delivery condition — supports the project's pickup-vs-delivery checklist cross-reference design.

---

## 5. Features Pakistani transporters expect (evidence-based)

**Table stakes (every local product has or advertises):**
- Bilty register UI that mirrors the paper register (TechnoVaders explicitly sells this)
- English + **Urdu** on documents and labels
- PKR everywhere; simple totals, no multi-currency
- Customer khata: per-party bilty history, dues, paid/pending, credit standing
- Print: bilty, receipt, ledger statement — with QR codes appearing as a trust/anti-fraud feature
- Daily backup (desktop-era habit; cloud sync answers the same anxiety)
- Reports as **Excel export + print** — accountants live in Excel
- WhatsApp as the communication backbone (notifications, support, sharing bilty/invoice PDFs)

**Differentiators (what Fleetable/startups compete on):**
- Driver mobile app: trip assignment, expense capture, POD photo/signature, **offline-first** (highway dead zones) — matches this project's Expo/offline plan
- Driver advance & settlement loop with live outstanding balances
- Broker/carrier network management with commission and performance tracking
- Multi-branch with live consolidated dashboard (Karachi head office + upcountry branches)
- Part-load (LTL) consolidation: many bilties per vehicle, per-bilty tracking and billing
- Spot-rate awareness / rate lists per route + vehicle type
- GPS integration (any tracker vendor), geofence alerts
- Freight financing hooks (Trukkr's whole thesis) — out of scope to build, but keep receivables data clean enough to support it later

**Anti-features (do not build):**
- GST/GSTIN/e-way bill fields (India-only)
- Complex TMS abstractions (waves, dock scheduling, multi-leg optimization) — Pakistani mid-size transporters won't use them
- File-heavy document management — WhatsApp pointer references suffice (already a project rule)

---

## 6. Karachi-specific compliance & tax context

- **Sindh sales tax on services (SRB):** road transport / carriage of goods by road is a taxable service administered by the **Sindh Revenue Board** (HQ Karachi). Standard services rate 15%; goods-transport-by-road historically **13%, with a reduced 8% option without input-tax adjustment**. The **Sindh Finance Act 2025** reclassified it as "Road Transport Services or Freight" and **removed the "inter-city" qualifier — intra-city goods transport is now taxable too**. Invoices need an optional SRB tax line and the client's SNTN; confirm the client's registration status and applicable rate with their tax advisor before hard-coding anything.
- **Withholding:** corporate customers routinely deduct income-tax withholding from transporter payments — receivables/ledger must record deduction-at-source amounts and allow invoice settlement at less than face value with a WHT reason. *(verify client's typical deduction rates)*
- **NHA axle-load regime:** National Highway Authority axle-weight limits are enforced at weigh stations; overload = fines/offloading. Capacity/axle checks at load planning (Fleetable advertises this) are a useful warning, not a blocker.
- **Vehicle documents to track per vehicle:** registration/token tax, fitness certificate, route permit, tracker certificate, insurance — expiry alerts are a cheap high-value feature.
- **No e-way bill / no GST consignment compliance** — bilty is a commercial document, not a government e-document. This keeps the document model simple.

---

## 7. Implications for our build (mapping to the existing design)

Most findings **validate decisions already in `docs/CRM-DESIGN.md`**: PKR `NUMERIC(14,2)`; both bilty entry modes; duplicate-bilty warn-not-block; English+Urdu checklist labels; WhatsApp media pointers instead of file storage; rate auto-fill as editable suggestion; partial payments on both receivable and payable sides; offline-first driver app.

Additions/emphases this research suggests (raise before the relevant module, don't act silently):

1. **Payment-mode on bilty (Paid / To-Pay / Account)** — confirm it's explicit in the Trip/Bilty model, since to-pay collection by driver feeds trip settlement.
2. **Charge breakdown lines on bilty** (kiraya, mazdoori/hamali, bilty fee, halting/demurrage, other) rather than a single freight figure.
3. **Munshiana/commission** as a named deduction type on carrier payables and broker ledger entries.
4. **SRB tax line + withholding-at-source** handling on invoices/payments (Billing module, step 6).
5. **Urdu on printed bilty/invoice**, not only on the checklist — bilingual document templates.
6. **Vehicle-class master list** (Suzuki → 22-wheeler → container) driving rate agreements and bookings.
7. **Vehicle document expiry tracking** (fitness, permit, token, insurance) — small module, high perceived value.
8. **Kata (weighbridge) weights** — first/second weighment fields on trips carrying bulk cargo.

---

## 8. Sources

- [Fleetable — Transport Management Software Pakistan](https://fleetable.tech/en-pk/transport-management-software/)
- [Fleetable Blog — Bilty or Bilti glossary](https://blog.fleetable.tech/glossary/bilty-or-bilti/)
- [Bilty Management System for Pakistani Goods Transporters — TechnoVaders](https://bilty.technovaders.com/)
- [Cargo Management System Pakistan — Software Linkers](https://www.softwarelinkers.com/cargo-management-system/)
- [TruckLoad.pk — spot rates & booking platform](https://truckload.pk/) and [spot-rate page](https://www.truckload.pk/rates)
- [Trukkr raises $6.4m, gets lending licence — Dawn](https://www.dawn.com/news/1740894)
- [BridgeLinx](https://www.bridgelinxpk.com/) · [BridgeLinx raises $10m seed — Business Recorder](https://www.brecorder.com/news/40120094/pakistans-bridgelinx-a-digital-freight-platform-raises-10mn-in-seed-round) · [CB Insights profile](https://www.cbinsights.com/company/bridgelinx)
- [Truck It In — CB Insights profile](https://www.cbinsights.com/company/truck-it-in)
- [What is Bilty in Transportation — NoBroker forum](https://www.nobroker.in/forum/what-is-bilty-in-transportation/) · [Fleetx — What is Bilty](https://blog.fleetx.ai/what-is-bilty-a-simple-explanation-for-transporters-shippers/) · [Transport Bilty Format — svtuition](https://www.svtuition.org/2013/05/transport-bilty-format.html)
- [SRB — Taxable Services](https://www.srb.gos.pk/srb/taxable-services/) · [SRB Working Tariff (PDF)](https://www.srb.gos.pk/srb/wp-content/uploads/2024/07/Final-Working-tariff.pdf) · [Sindh Finance Act 2025 changes — TaxSupportHub](https://taxsupporthub.com/sindh-sales-tax-on-services-major-changes-under-the-sindh-finance-act-2025/) · [pkrevenue — sales tax rates on goods transportation](https://pkrevenue.com/sales-tax-rates-on-services-provided-by-goods-transportation/)
- [Khan Goods — vehicle types & rates](https://khangoods.com.pk/rates/) · [Talal Goods — Mazda/Shehzore rentals](https://talalgoods.com/mazda-shehzore-for-rent/) · [Goods Transport Company Karachi](https://goodstransportcompanykarachi.pk/)
