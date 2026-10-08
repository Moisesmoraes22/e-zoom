-- Mercado Livre coupons read from the affiliate channel by the collector (service role).
-- The public site only reads them, and only while they are valid.
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code = upper(code) and char_length(code) between 3 and 30),
  discount_kind text not null check (discount_kind in ('percent', 'amount')),
  discount_value numeric not null check (discount_value > 0),
  min_purchase numeric check (min_purchase >= 0),
  max_discount numeric check (max_discount >= 0),
  category text,
  expires_at timestamptz,
  affiliate_url text,
  posted_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table public.coupons enable row level security;

-- Valid = not expired; a post without a date is shown for 14 days only.
create policy "coupons are public while valid" on public.coupons
  for select to anon, authenticated
  using (
    coalesce(expires_at, posted_at + interval '14 days') > now()
  );

revoke all on public.coupons from anon, authenticated;
grant select (code, discount_kind, discount_value, min_purchase, max_discount, category, expires_at, affiliate_url, posted_at)
  on public.coupons to anon, authenticated;
