-- Clicks on "Ver oferta". One row = one click on one offer. No personal data at all:
-- no IP, no user id, no user agent, only which offer, from which part of the site, and when.
create table public.offer_clicks (
  id         bigint      generated always as identity primary key,
  offer_id   uuid        not null references public.offers (id) on delete cascade,
  origin     text        not null check (origin in ('home', 'busca', 'categoria', 'produto', 'outro')),
  clicked_at timestamptz not null default now()
);

create index offer_clicks_offer_id_idx on public.offer_clicks (offer_id);
create index offer_clicks_clicked_at_idx on public.offer_clicks (clicked_at);

alter table public.offer_clicks enable row level security;

-- The site records clicks with the public (anon) key: insert only. Nobody can read,
-- change or delete rows through the API; counts are read server-side later.
revoke all on public.offer_clicks from anon, authenticated;
grant insert on public.offer_clicks to anon;

create policy offer_clicks_insert on public.offer_clicks
  for insert to anon
  with check (true);
