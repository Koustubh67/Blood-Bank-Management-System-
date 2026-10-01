-- RaktFlow — PostgreSQL schema for the future backend.
--
-- The frontend currently stores the same entities in the browser
-- (src/store/db.ts). Each table below maps 1:1 to a type in src/types/index.ts
-- so the service layer (src/services/*) can switch to a real API without UI changes.

create extension if not exists "pgcrypto";
create extension if not exists "postgis";
create extension if not exists "citext";

create type user_role      as enum ('individual', 'hospital', 'centre_staff', 'rider', 'admin');
create type blood_group    as enum ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');
create type component_code as enum ('WB', 'PRBC', 'FFP', 'PLT', 'CRYO');
create type order_priority as enum ('emergency', 'urgent', 'scheduled');
create type order_status   as enum (
  'pending_payment', 'payment_failed', 'placed', 'verified',
  'packed', 'dispatched', 'arriving', 'delivered', 'cancelled'
);
create type payment_method as enum ('upi', 'card', 'netbanking', 'credit');
create type payment_status as enum ('created', 'success', 'failed', 'refunded');

-- ---------- cities ----------

-- Every served city (at least one per state/UT). `eraktkosh_state_code` drives the camp schedule.
create table cities (
  id                  text primary key,          -- e.g. 'mumbai'
  name                text not null,
  state               text not null,
  eraktkosh_state_code text not null,
  center              geography(point, 4326) not null
);

-- ---------- facilities ----------

create table blood_centres (
  id            uuid primary key default gen_random_uuid(),
  city_id       text not null references cities(id),
  name          text not null,
  licence_no    text not null unique,          -- Drugs & Cosmetics Rules licence
  licence_valid_until date not null,
  area          text not null,
  location      geography(point, 4326) not null,
  open_24x7     boolean not null default false,
  created_at    timestamptz not null default now()
);
create index on blood_centres using gist (location);

create table hospitals (
  id               uuid primary key default gen_random_uuid(),
  city_id          text not null references cities(id),
  name             text not null,
  registration_no  text not null unique,       -- Clinical Establishments registration
  gstin            text,
  area             text not null,
  location         geography(point, 4326) not null,
  beds             int,
  credit_limit_inr numeric(12, 2) not null default 0,
  verified_at      timestamptz,
  created_at       timestamptz not null default now()
);
create index on hospitals using gist (location);

-- Outlets: licensed blood storage centres beside busy hospitals, each stocked
-- by a licensed "mother" blood centre (src/data/outlets.ts).
create table outlets (
  id              uuid primary key default gen_random_uuid(),
  city_id         text not null references cities(id),
  name            text not null,
  area            text not null,
  location        geography(point, 4326) not null,
  licence_no      text not null unique,        -- blood storage centre licence
  mother_centre_id uuid not null references blood_centres(id),
  open_24x7       boolean not null default true,
  capacity_units  int not null check (capacity_units > 0),
  opened_on       date not null
);
create index on outlets using gist (location);

-- Fridge logger readings, one per minute per outlet; alarm outside 2–6 °C.
create table outlet_temperature_log (
  outlet_id  uuid not null references outlets(id),
  at         timestamptz not null default now(),
  temp_c     numeric(4, 1) not null,
  primary key (outlet_id, at)
);

-- Real hospitals near the network are read live from OpenStreetMap and are
-- not stored; only registered partners live in `hospitals`.

-- ---------- people ----------

create table users (
  id             uuid primary key default gen_random_uuid(),
  role           user_role not null,
  city_id        text references cities(id),   -- home city chosen at sign-up
  name           text not null,
  email          citext not null unique,
  phone          text not null,
  password_hash  text not null,                -- argon2id on the server
  hospital_id    uuid references hospitals(id),
  centre_id      uuid references blood_centres(id),
  verified       boolean not null default false,
  created_at     timestamptz not null default now(),
  deleted_at     timestamptz                    -- DPDP erasure: soft delete, then purge
);

create table consents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id),
  purpose     text not null,                   -- e.g. 'order_processing', 'donor_contact'
  notice_version text not null,
  granted_at  timestamptz not null default now(),
  withdrawn_at timestamptz
);

-- ---------- stock ----------

-- One row per bag. Aggregate views give the live counts shown in the UI.
create table blood_units (
  id            uuid primary key default gen_random_uuid(),
  centre_id     uuid not null references blood_centres(id),
  bag_no        text not null,
  blood_group   blood_group not null,
  component     component_code not null,
  collected_at  timestamptz not null,
  expires_at    timestamptz not null,
  screening_passed boolean not null,           -- HIV, HBV, HCV, syphilis, malaria (+NAT)
  reserved_for_order uuid,
  issued_at     timestamptz,
  unique (centre_id, bag_no)
);
create index on blood_units (centre_id, blood_group, component) where issued_at is null and reserved_for_order is null;

create view centre_stock as
select centre_id, blood_group, component, count(*) as units
from blood_units
where issued_at is null and reserved_for_order is null and expires_at > now() and screening_passed
group by centre_id, blood_group, component;

-- ---------- orders ----------

create table orders (
  id                text primary key,           -- RF-XXXXXX
  user_id           uuid not null references users(id),
  hospital_id       uuid not null references hospitals(id),
  centre_id         uuid references blood_centres(id),
  priority          order_priority not null,
  status            order_status not null default 'pending_payment',
  patient_name      text not null,
  patient_age       int not null check (patient_age between 0 and 120),
  patient_gender    text not null,
  patient_group     blood_group not null,
  patient_uhid      text,
  ward              text,
  diagnosis         text,
  doctor_name       text not null,
  doctor_reg_no     text not null,
  requisition_file  text not null,             -- object-storage key, encrypted at rest
  processing_inr    numeric(10, 2) not null,
  logistics_inr     numeric(10, 2) not null,
  logistics_gst_inr numeric(10, 2) not null,
  total_inr         numeric(10, 2) not null,
  handover_otp_hash text not null,
  placed_at         timestamptz,
  delivered_at      timestamptz,
  cancelled_at      timestamptz,
  cancel_reason     text,
  created_at        timestamptz not null default now()
);
create index on orders (user_id, created_at desc);
create index on orders (hospital_id, created_at desc);

create table order_items (
  order_id    text not null references orders(id) on delete cascade,
  blood_group blood_group not null,
  component   component_code not null,
  units       int not null check (units between 1 and 10),
  primary key (order_id, blood_group, component)
);

create table order_events (
  id         bigserial primary key,
  order_id   text not null references orders(id) on delete cascade,
  status     order_status not null,
  actor_id   uuid references users(id),
  note       text,
  at         timestamptz not null default now()
);

-- ---------- payments ----------

create table payments (
  id              uuid primary key default gen_random_uuid(),
  order_id        text not null references orders(id),
  method          payment_method not null,
  status          payment_status not null,
  amount_inr      numeric(10, 2) not null,
  gateway         text not null,               -- razorpay | cashfree | ...
  gateway_order_id text,
  gateway_payment_id text,
  instrument_label text,                       -- masked only; never store PAN/CVV
  failure_reason  text,
  created_at      timestamptz not null default now()
);

create table refunds (
  id           uuid primary key default gen_random_uuid(),
  payment_id   uuid not null references payments(id),
  amount_inr   numeric(10, 2) not null,
  gateway_refund_id text,
  created_at   timestamptz not null default now()
);

-- ---------- delivery ----------

create table riders (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references users(id),
  vehicle   text not null,
  cold_chain_trained_at date not null
);

create table deliveries (
  order_id      text primary key references orders(id),
  rider_id      uuid references riders(id),
  cold_box_id   text not null,
  dispatched_at timestamptz,
  arrived_at    timestamptz,
  handed_over_at timestamptz
);

-- High-frequency telemetry: rider GPS and cold-box temperature. Stream to the
-- tracking page over WebSocket / SSE; keep here for audits.
create table delivery_telemetry (
  order_id   text not null references orders(id),
  at         timestamptz not null default now(),
  location   geography(point, 4326),
  temp_c     numeric(4, 1),
  compartment text,
  primary key (order_id, at)
);

-- ---------- donors ----------

create table donor_bookings (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references users(id),
  name         text not null,
  phone        text not null,
  blood_group  blood_group not null,
  age          int not null,
  weight_kg    int not null,
  last_donation date,
  centre_id    uuid not null references blood_centres(id),
  slot         timestamptz not null,
  created_at   timestamptz not null default now()
);

-- Camp pledges. Camps themselves come live from the national e-RaktKosh
-- schedule; we store only the fields needed to show the pledge later.
create type pledge_status as enum ('pledged', 'donated', 'cancelled');

create table camp_pledges (
  id           uuid primary key default gen_random_uuid(),
  camp_id      text not null,                  -- e-RaktKosh camp request number
  camp_name    text not null,
  camp_date    date not null,
  venue        text not null,
  district     text not null,
  state        text not null,
  user_id      uuid references users(id),
  name         text not null,
  phone        text not null,
  blood_group  blood_group,
  status       pledge_status not null default 'pledged',
  donated_at   timestamptz,
  created_at   timestamptz not null default now()
);
-- One active pledge per phone per camp.
create unique index on camp_pledges (camp_id, phone) where status <> 'cancelled';
create index on camp_pledges (camp_date);

-- ---------- operations (admin console) ----------

-- Everyone who works at a blood centre or outlet. A store is either a centre
-- or an outlet, so exactly one of the two references is set.
create type staff_role   as enum ('manager', 'lab_tech', 'medical_officer', 'dispatcher', 'rider');
create type staff_shift  as enum ('morning', 'evening', 'night');
create type staff_status as enum ('on_shift', 'off_shift', 'leave', 'inactive');

create table staff (
  id                 uuid primary key default gen_random_uuid(),
  centre_id          uuid references blood_centres(id),
  outlet_id          uuid references outlets(id),
  role               staff_role not null,
  name               text not null,
  phone              text not null,
  shift              staff_shift not null,
  status             staff_status not null default 'off_shift',
  joined_on          date not null,
  medical_reg_no     text,                       -- medical officers
  cold_chain_trained_on date,
  check ((centre_id is null) <> (outlet_id is null))
);

-- Riders' vehicles and licences, checked before every shift.
create table rider_vehicles (
  staff_id             uuid primary key references staff(id),
  vehicle_type         text not null check (vehicle_type in ('ev_scooter', 'bike')),
  registration_no      text not null unique,
  driving_licence_expiry date not null
);

-- Dispatch state per order: stage, priority score inputs and the rider.
create type ops_stage as enum ('incoming', 'verifying', 'packing', 'ready', 'out_for_delivery', 'delivered', 'rejected', 'cancelled');

create table order_dispatch (
  order_id        text primary key references orders(id),
  stage           ops_stage not null default 'incoming',
  centre_id       uuid references blood_centres(id),
  outlet_id       uuid references outlets(id),
  rider_id        uuid references staff(id),
  borrowed_rider  boolean not null default false, -- assigned from another store in surge mode
  dispatch_due_at timestamptz not null,           -- emergency 10 min, urgent 30 min, scheduled 2 h after ordering
  stage_changed_at timestamptz not null default now()
);
create index on order_dispatch (stage, dispatch_due_at);

-- Every manual action on an order (verify, reject, escalate, reassign…), with the reason.
create table order_audit (
  id        bigserial primary key,
  order_id  text not null references orders(id),
  actor_id  uuid references users(id),
  action    text not null,
  reason    text,
  at        timestamptz not null default now()
);

-- Store-wise collections, one row per store per day (rolled up from payments and refunds).
create table store_collections_daily (
  day            date not null,
  centre_id      uuid references blood_centres(id),
  outlet_id      uuid references outlets(id),
  orders         int not null default 0,
  processing_inr numeric(12, 2) not null default 0,
  logistics_inr  numeric(12, 2) not null default 0,
  gst_inr        numeric(12, 2) not null default 0,
  refunds_inr    numeric(12, 2) not null default 0,
  upi_inr        numeric(12, 2) not null default 0,
  card_inr       numeric(12, 2) not null default 0,
  netbanking_inr numeric(12, 2) not null default 0,
  credit_inr     numeric(12, 2) not null default 0,
  unique (day, centre_id, outlet_id)
);
