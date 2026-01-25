-- Create inventory_items table
create table if not exists inventory_items (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references productos(id) on delete cascade not null,
  serial_number text not null,
  model_variant text, -- In case there's a specific model variant per unit
  
  -- Purchase/Input Info
  cost_usd numeric,
  purchase_date date default current_date,
  exchange_rate_purchase numeric,
  
  -- Sales/Output Info
  status text check (status in ('available', 'sold')) default 'available',
  sale_date date,
  client_name text,
  sale_price_usd numeric, -- Optional but good to have
  sale_price_ars numeric, -- Sales price in local currency
  contract_files text[], -- Array of URLs
  
  -- tenant_id uuid, -- skipping tenant_id strict FK for now as simple auth used
  created_at timestamptz default now()
);

-- Enable RLS
alter table inventory_items enable row level security;

-- Policies
drop policy if exists "Enable all access for authenticated users" on inventory_items;
create policy "Enable all access for authenticated users"
on inventory_items for all
to authenticated
using (true)
with check (true);

-- Create storage bucket for contracts
insert into storage.buckets (id, name, public)
values ('sales-contracts', 'sales-contracts', true)
on conflict (id) do nothing;

-- Storage policies
drop policy if exists "Public Access" on storage.objects;
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'sales-contracts' );

drop policy if exists "Authenticated Export" on storage.objects;
create policy "Authenticated Export"
on storage.objects for insert
with check ( bucket_id = 'sales-contracts' );

drop policy if exists "Authenticated Update" on storage.objects;
create policy "Authenticated Update"
on storage.objects for update
using ( bucket_id = 'sales-contracts' );
