-- MotoBill Pro — esquema inicial (PostgreSQL / Supabase)
-- Ejecutar en el SQL Editor del proyecto de Supabase (plan gratuito).

create extension if not exists "pgcrypto";

create type public.app_role as enum ('admin', 'mechanic', 'cashier');
create type public.work_order_status as enum (
  'recibido', 'en_revision', 'en_reparacion', 'listo', 'entregado'
);
create type public.quote_status as enum (
  'borrador', 'enviada', 'aceptada', 'convertida', 'rechazada'
);
create type public.invoice_status as enum ('pendiente', 'pagada', 'anulada');
create type public.appointment_status as enum ('programada', 'completada', 'cancelada');
create type public.line_kind as enum ('labor', 'part');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tax_id text not null default '',
  address text not null default '',
  phone text not null default '',
  email text not null default '',
  iva_rate numeric(5,2) not null default 19,
  currency text not null default 'COP',
  invoice_prefix text not null default 'FAC',
  quote_prefix text not null default 'COT',
  work_order_prefix text not null default 'OT',
  next_invoice_number integer not null default 1,
  next_quote_number integer not null default 1,
  next_work_order_number integer not null default 1,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  full_name text not null,
  email text not null default '',
  role public.app_role not null default 'cashier',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  email text not null default '',
  phone text not null default '',
  document_id text not null default '',
  address text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table public.motorcycles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  brand text not null,
  model text not null,
  year integer not null,
  plate text not null,
  vin text not null default '',
  mileage integer not null default 0,
  photo_path text not null default '',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null,
  description text not null,
  category text not null default '',
  purchase_price numeric(12,2) not null default 0,
  sale_price numeric(12,2) not null default 0,
  stock numeric(12,2) not null default 0,
  min_stock numeric(12,2) not null default 0,
  unique (organization_id, code)
);

create table public.work_orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  number text not null,
  customer_id uuid not null references public.customers(id),
  motorcycle_id uuid not null references public.motorcycles(id),
  assigned_user_id uuid references public.profiles(id),
  status public.work_order_status not null default 'recibido',
  diagnosis text not null default '',
  notes text not null default '',
  mileage_in integer not null default 0,
  signature_data text not null default '',
  received_at timestamptz not null default now(),
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  unique (organization_id, number)
);

create table public.work_order_labor (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  description text not null,
  hours numeric(8,2) not null default 0,
  rate numeric(12,2) not null default 0
);

create table public.work_order_parts (
  id uuid primary key default gen_random_uuid(),
  work_order_id uuid not null references public.work_orders(id) on delete cascade,
  inventory_item_id uuid references public.inventory_items(id),
  description text not null,
  quantity numeric(12,2) not null,
  unit_price numeric(12,2) not null
);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  number text not null,
  customer_id uuid not null references public.customers(id),
  motorcycle_id uuid references public.motorcycles(id),
  status public.quote_status not null default 'borrador',
  notes text not null default '',
  valid_until date,
  iva_rate numeric(5,2) not null,
  converted_invoice_id uuid,
  created_at timestamptz not null default now(),
  unique (organization_id, number)
);

create table public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  kind public.line_kind not null,
  description text not null,
  quantity numeric(12,2) not null,
  unit_price numeric(12,2) not null
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  number text not null,
  quote_id uuid references public.quotes(id),
  work_order_id uuid references public.work_orders(id),
  customer_id uuid not null references public.customers(id),
  status public.invoice_status not null default 'pendiente',
  notes text not null default '',
  iva_rate numeric(5,2) not null,
  issued_at timestamptz not null default now(),
  paid_at timestamptz,
  unique (organization_id, number)
);

create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  kind public.line_kind not null,
  description text not null,
  quantity numeric(12,2) not null,
  unit_price numeric(12,2) not null
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_id uuid not null references public.customers(id),
  motorcycle_id uuid references public.motorcycles(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  service_type text not null,
  notes text not null default '',
  status public.appointment_status not null default 'programada',
  reminder_sent_at timestamptz
);

create index idx_customers_org on public.customers(organization_id);
create index idx_motorcycles_customer on public.motorcycles(customer_id);
create index idx_work_orders_org_status on public.work_orders(organization_id, status);
create index idx_inventory_org_code on public.inventory_items(organization_id, code);
create index idx_invoices_org_issued on public.invoices(organization_id, issued_at);
create index idx_appointments_org_starts on public.appointments(organization_id, starts_at);

create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.profiles where id = auth.uid()
$$;

create or replace function public.current_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and active = true
$$;

create or replace function public.register_workshop(
  workshop_name text,
  full_name text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_org uuid;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;
  if exists (select 1 from public.profiles where id = auth.uid()) then
    raise exception 'El usuario ya pertenece a un taller';
  end if;

  insert into public.organizations (name)
  values (workshop_name)
  returning id into new_org;

  insert into public.profiles (id, organization_id, full_name, email, role)
  values (
    auth.uid(),
    new_org,
    full_name,
    coalesce((select email from auth.users where id = auth.uid()), ''),
    'admin'
  );

  return new_org;
end;
$$;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.motorcycles enable row level security;
alter table public.inventory_items enable row level security;
alter table public.work_orders enable row level security;
alter table public.work_order_labor enable row level security;
alter table public.work_order_parts enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.appointments enable row level security;

create policy org_select on public.organizations
  for select using (id = public.current_org_id());
create policy org_update on public.organizations
  for update using (id = public.current_org_id() and public.current_role() = 'admin');

create policy profiles_select on public.profiles
  for select using (organization_id = public.current_org_id());
create policy profiles_insert on public.profiles
  for insert with check (
    organization_id = public.current_org_id() and public.current_role() = 'admin'
  );
create policy profiles_update on public.profiles
  for update using (
    organization_id = public.current_org_id() and public.current_role() = 'admin'
  );

create policy customers_all on public.customers
  for all using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

create policy motorcycles_all on public.motorcycles
  for all using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

create policy inventory_select on public.inventory_items
  for select using (organization_id = public.current_org_id());
create policy inventory_write on public.inventory_items
  for all using (
    organization_id = public.current_org_id()
    and public.current_role() in ('admin')
  )
  with check (
    organization_id = public.current_org_id()
    and public.current_role() in ('admin')
  );

create policy work_orders_all on public.work_orders
  for all using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

create policy work_order_labor_all on public.work_order_labor
  for all using (
    exists (
      select 1 from public.work_orders wo
      where wo.id = work_order_id and wo.organization_id = public.current_org_id()
    )
  );

create policy work_order_parts_all on public.work_order_parts
  for all using (
    exists (
      select 1 from public.work_orders wo
      where wo.id = work_order_id and wo.organization_id = public.current_org_id()
    )
  );

create policy quotes_all on public.quotes
  for all using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

create policy quote_items_all on public.quote_items
  for all using (
    exists (
      select 1 from public.quotes q
      where q.id = quote_id and q.organization_id = public.current_org_id()
    )
  );

create policy invoices_all on public.invoices
  for all using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

create policy invoice_items_all on public.invoice_items
  for all using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id and i.organization_id = public.current_org_id()
    )
  );

create policy appointments_all on public.appointments
  for all using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

-- Bucket de fotos de motocicletas (público de lectura, escritura autenticada del org)
insert into storage.buckets (id, name, public)
values ('motorcycle-photos', 'motorcycle-photos', true)
on conflict (id) do nothing;

-- Políticas del bucket: cualquiera lee; solo un usuario autenticado escribe y
-- únicamente dentro de la carpeta de su propia organización.
drop policy if exists motorcycle_photos_read on storage.objects;
create policy motorcycle_photos_read on storage.objects
  for select using (bucket_id = 'motorcycle-photos');

drop policy if exists motorcycle_photos_insert on storage.objects;
create policy motorcycle_photos_insert on storage.objects
  for insert with check (
    bucket_id = 'motorcycle-photos'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

drop policy if exists motorcycle_photos_update on storage.objects;
create policy motorcycle_photos_update on storage.objects
  for update using (
    bucket_id = 'motorcycle-photos'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );

drop policy if exists motorcycle_photos_delete on storage.objects;
create policy motorcycle_photos_delete on storage.objects
  for delete using (
    bucket_id = 'motorcycle-photos'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = public.current_org_id()::text
  );
