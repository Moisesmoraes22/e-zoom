-- What the channel publisher already posted, so a price drop is announced once. Only the collector
-- (service key) touches it: row level security is on and there are no policies for the public keys.
create table if not exists public.telegram_posts (
  id bigint generated always as identity primary key,
  offer_id uuid not null references public.offers(id) on delete cascade,
  price numeric(12, 2) not null,
  posted_at timestamptz not null default now()
);
create index if not exists telegram_posts_offer_time on public.telegram_posts (offer_id, posted_at desc);
create index if not exists telegram_posts_time on public.telegram_posts (posted_at desc);
alter table public.telegram_posts enable row level security;
