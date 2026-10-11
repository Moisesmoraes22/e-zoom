-- Real "N people viewed this offer" signal: one row per product-page view (offer id + time; nothing
-- about the visitor). record_view stores a view (capped, like record_click) and answers with the
-- number of views in the last 24 h, so the page needs one call. The table has no public grants:
-- only these functions touch it.
create table if not exists public.offer_views (
  id bigint generated always as identity primary key,
  offer_id uuid not null references public.offers(id) on delete cascade,
  viewed_at timestamptz not null default now()
);
create index if not exists offer_views_offer_time on public.offer_views (offer_id, viewed_at desc);
alter table public.offer_views enable row level security;

create or replace function public.record_view(p_offer uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Same offer: at most 20 views a minute. Whole site: at most 600 a minute.
  if (select count(*) from public.offer_views where offer_id = p_offer and viewed_at > now() - interval '1 minute') < 20
     and (select count(*) from public.offer_views where viewed_at > now() - interval '1 minute') < 600 then
    insert into public.offer_views (offer_id) values (p_offer);
  end if;
  -- Old rows are not needed: the signal looks at 24 h.
  if random() < 0.01 then
    delete from public.offer_views where viewed_at < now() - interval '3 days';
  end if;
  return (select count(*)::integer from public.offer_views where offer_id = p_offer and viewed_at > now() - interval '24 hours');
exception when foreign_key_violation then
  return 0;
end
$$;

revoke all on function public.record_view(uuid) from public;
grant execute on function public.record_view(uuid) to anon, authenticated;
