-- Reviews & Ratings system
create table if not exists public.reviews (
  id uuid default gen_random_uuid() primary key,
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating smallint not null check (rating >= 1 and rating <= 5),
  title text not null default '',
  body text not null default '',
  photos text[] default '{}',
  verified_purchase boolean not null default false,
  approved boolean not null default false,
  admin_response text,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_reviews_product_id on public.reviews(product_id);
create index if not exists idx_reviews_user_id on public.reviews(user_id);
create index if not exists idx_reviews_approved on public.reviews(approved);

-- RLS
alter table public.reviews enable row level security;

-- Anyone can read approved reviews
create policy "Approved reviews are public"
  on public.reviews for select
  using (approved = true);

-- Authenticated users can read their own reviews (even unapproved)
create policy "Users can read own reviews"
  on public.reviews for select
  to authenticated
  using (auth.uid() = user_id);

-- Authenticated users can insert their own reviews
create policy "Users can create reviews"
  on public.reviews for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Service role bypass for admin operations (approve/reject/respond)
