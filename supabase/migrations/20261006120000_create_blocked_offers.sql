-- Offers that must never be collected again (wrong price at the source, not a product we want...).
-- The engine reads it with the secret key on every run; nobody else can read or write it.
create table public.blocked_offers (
  store_id    text        not null,
  external_id text        not null,
  reason      text        not null,
  blocked_at  timestamptz not null default now(),
  primary key (store_id, external_id)
);

alter table public.blocked_offers enable row level security;
revoke all on public.blocked_offers from anon, authenticated;
