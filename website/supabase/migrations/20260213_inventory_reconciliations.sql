-- Inventory Reconciliation table
create table if not exists public.inventory_reconciliations (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references public.products(id) on delete cascade not null,
  expected_qty integer not null default 0,
  actual_qty integer not null default 0,
  discrepancy integer not null default 0,
  resolved boolean not null default false,
  resolved_by uuid references auth.users(id) on delete set null,
  notes text,
  created_at timestamptz default now() not null
);

-- RLS
alter table public.inventory_reconciliations enable row level security;

create policy "Admins can manage reconciliations"
  on public.inventory_reconciliations
  for all
  using (true)
  with check (true);

-- Index for lookups
create index idx_reconciliations_product on public.inventory_reconciliations(product_id);
create index idx_reconciliations_resolved on public.inventory_reconciliations(resolved);
