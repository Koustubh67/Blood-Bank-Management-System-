# RaktFlow — Blood, delivered in minutes

RaktFlow is a web platform for getting verified blood units from licensed blood centres to hospitals fast, with live tracking, cold-chain monitoring and transparent, legal pricing. It serves two audiences:

- **Patients' families** order units for a patient admitted in a partner hospital, pay online and track the delivery live.
- **Hospitals** place bulk and one-tap emergency orders, pay on credit terms and watch every delivery from a dashboard.

> **Prototype.** The app runs entirely in the browser with a simulated database, payment gateway and delivery fleet. Partner blood centres, partner hospitals, outlets and riders are fictional; the donation camps and the hospitals on the "near you" map are real public data. No real blood is dispatched.

## How it stays legal (India)

| Rule | How the product enforces it |
| --- | --- |
| Blood cannot be sold | Only NBTC-capped **processing charges** per unit + a flat cold-chain logistics fee are billed (`src/data/blood.ts`, `src/config/brand.ts`). |
| Units only from licensed blood centres | Every centre carries a licence number; matching picks only from the partner network. |
| Transfusion needs a doctor's requisition | Orders require the treating doctor's name, registration number and an uploaded signed requisition form. |
| Transfusion only at a medical facility | Delivery is only to registered partner hospitals' transfusion desks, never to homes. |
| Safe handover | 4-digit OTP handover; hospital does cross-match and bedside checks. |
| Data protection (DPDP Act 2023) | Consent at sign-up, minimum data collected, data export and account deletion in **Account**. |

The legal pages (`/legal/*`) are drafts. Have a qualified lawyer review them, and confirm the current NBTC processing-charge caps, before launch.

## Features

- **Branded home page** with live network stock, activity ticker and a live delivery preview, a **"where the hours go" section** that puts today's counter-to-counter process (5–13 hours) and the RaktFlow route (≈ 15 minutes) on the same time scale, step by step, and a **near-you band** with live camps and outlets.
- **Every state, every visitor's own city**: 37 cities, at least one in each state and union territory. Visitors pick their city at sign-up, and a quick-commerce-style **location bar** in the header ("Blood in 10 min · Bandra East, Mumbai") can use the device's live location to snap to the nearest city and name the neighbourhood. Stock, stores, outlets, partner hospitals, camps and maps all follow it. Delhi's network is hand-made; every other city's centres, outlets and partner hospitals sit at real neighbourhoods (`src/data/nationalNetwork.ts`).
- **Operations console** (`/admin`, sign in as the operations admin): a separate back office for running stores across every city.
  - **Overview:** live orders by priority, average order-to-dispatch time, orders at risk of missing their target, riders free and busy, today's collections, stock and fridge alerts, plus a "needs attention" list (expiring licences, fridges out of range, short blood groups).
  - **Priority board:** orders flow from intake to handover. Each card has a priority score (emergency, urgent or scheduled, time waiting, rare groups, platelets, risk of missing the dispatch target) and a countdown ring. Admins can verify or reject requisitions, assign riders, escalate with a reason (audited) and hand over against the OTP.
  - **Dispatch:** riders per store on a live map. Auto-assign gives the highest-score order to the nearest free rider. When the load meter shows Busy or Surge, **Surge mode** borrows riders from neighbouring stores and holds scheduled orders that have time to spare, and admins can call in off-shift riders. "Simulate rush hour" demonstrates this.
  - **Stores:** store-wise stock, fridge temperature, orders, collections and staff on shift.
  - **Staff & drivers:** records with add, edit and deactivate, and licence and training flags.
  - **Collections:** store-wise takings by day and payment method, with CSV export.
  - **Alerts menu** (bell in the top bar): new-order pop-ups for every order, emergencies only (default) or off; the chime; and a switch to pause the simulated order feed. A running rush hour can be stopped from its button or the menu.
- **Order and payment sounds**: original chimes synthesised with the Web Audio API when an order is placed, payment succeeds or fails, plus an optional spoken confirmation ("Payment of ₹1,849 successful") in English or Hindi using the device's own voice. Toggle from the account menu.
- **Donation camps** (`/camps`): real upcoming camps from the national **e-RaktKosh** schedule by state, district and date, with directions, organiser contact, a link to pre-register officially, and **pledges** that are counted (pledged → donated → lives helped).
- **Hospitals & outlets near you** (`/network`): real hospitals from **OpenStreetMap** around the city centre or the user's location, each matched to the nearest RaktFlow **outlet** (licensed blood storage centre) with distance, emergency ride time, live fridge temperature and shelf count.
- **Original illustrations**: the people (`src/components/characters/Person.tsx`) and icon props (`Prop.tsx`) are drawn in SVG for this project, so there is no third-party artwork to license.
- **Order flow** in 4 steps: patient and hospital → blood and urgency (live stock and ETA) → prescription and declarations → review.
- **Checkout** with UPI, card (Luhn check, brand detection), net banking and hospital credit, plus a test-mode panel.
- **Payment success and failure pages**, with a printable receipt and a handover OTP.
- **Real-time tracking**: live map with road routing, a moving rider, ETA countdown, stage timeline, cold-box temperatures, cancellation and a shareable link.
- **Live stock page**: network stock by group and component, centre map, activity feed and compatibility hints.
- **Hospital dashboard**: KPIs, one-tap emergency orders, active deliveries, history and a usage chart.
- **Donor flow**: eligibility check, slot booking and a digital donor card.
- **Safety page** (cold chain, testing, compatibility checker), **user manual with FAQs**, and **legal centre**.

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Patient / family | `demo@raktflow.example` | `demo1234` |
| Hospital | `hospital@raktflow.example` | `demo1234` |
| Operations admin | `admin@raktflow.example` | `demo1234` |

To test payments, use card `4111 1111 1111 1111` for a successful payment and `4000 0000 0000 0002` for a declined one. For UPI, use `success@razorpay` or `failure@upi`. On the tracking page, use **Demo controls → Fast-forward** to move the delivery along.

## Run it

Requires Node 20+.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
```

## Project structure

```
src/
  config/brand.ts        brand name, support numbers, fees, demo flag
  types/                 domain types (Order, BloodCentre, …)
  data/                  blood components, pricing, compatibility, partner network
  store/db.ts            browser "database" (localStorage, synced across tabs)
  services/              the API layer: auth, orders, payments, tracking, inventory, donors
  hooks/                 shared hooks
  components/
    ui/                  design-system primitives
    layout/              navbar, footer, layout, auth guard
    map/                 Leaflet live map
    …                    feature components per page
  pages/                 one file per route
docs/database-schema.sql PostgreSQL schema for the future backend
legacy/                  the original static HTML version
```

## Live data sources

| Data | Source | Notes |
| --- | --- | --- |
| Blood donation camps | e-RaktKosh public camp schedule (MoHFW) | No key. Its API sends a duplicated CORS header that browsers reject, so it is called through a same-origin proxy at `/api/eraktkosh` (`vite.config.ts` for dev/preview, `vercel.json` and `public/_redirects` for production). Override with `VITE_ERAKTKOSH_PROXY`. |
| Hospitals | OpenStreetMap via the Overpass API | No key; tries several mirrors and falls back to a bundled Delhi snapshot (`src/data/hospitalsSnapshot.ts`). |
| Reverse geocoding ("use my location") | OpenStreetMap Nominatim | Light, user-triggered use only, per its usage policy. |
| Neighbourhoods for the national network, saved hospital lists per city | OpenStreetMap via Overpass, captured 1 Oct 2026 | Bundled (`src/data/nationalNetwork.ts`, `src/data/hospitals/*.json`), loaded per city on demand. |

RaktFlow is not affiliated with e-RaktKosh or any hospital shown. Real hospitals are shown for context; orders still go only to registered partner hospitals. Outlets, their licences, fridge readings and stock are simulated.

## Adding the real backend later

Pages never touch storage directly. They call functions in `src/services/*`, which currently read and write `src/store/db.ts`. To go live:

1. Build an API that implements the schema in `docs/database-schema.sql`.
2. Replace each service function body with a `fetch` to `VITE_API_URL`, keeping the same signatures.
3. Payments: create gateway orders server-side (Razorpay, Cashfree, etc.) and verify signatures on the server. Then implement the `PaymentGateway` interface in `src/services/payments.ts` and call `setPaymentGateway()`.
4. Tracking: push rider GPS and cold-box temperatures over WebSocket or SSE instead of the time-based simulation in `src/services/tracking.ts`.
5. Set `DEMO_MODE = false` in `src/config/brand.ts`.

## Credits

Map tiles © Esri (World Light Gray Canvas) with data from Esri, HERE, Garmin and © OpenStreetMap contributors. Check Esri's terms before production use, or switch to a keyed provider. Road routing uses the public OSRM demo server, which is fine for a prototype but not for production. Hospital data © OpenStreetMap contributors (ODbL). Camp schedule from e-RaktKosh, Ministry of Health & Family Welfare. The original static template is preserved in `legacy/`.
