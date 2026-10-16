-- Exibições: how many times each offer was shown (card at least half on screen for 1 s, once per page),
-- per day, list (vitrine) and position range. Only numbers, nothing about the visitor. With the clicks
-- (which now also carry the list and position) they give the CTR = clicks ÷ exibições.
create table if not exists public.offer_impressions (
  day date not null,
  offer_id uuid not null references public.offers(id) on delete cascade,
  shelf text not null,
  position_bucket smallint not null,
  impressions integer not null default 0,
  primary key (day, offer_id, shelf, position_bucket)
);
alter table public.offer_impressions enable row level security;
create index if not exists offer_impressions_offer_idx on public.offer_impressions (offer_id);

-- Batches from the site (see src/app/api/impressions): at most 60 items, list names and positions
-- checked, unknown offers ignored. Repeated items in a batch add up.
create or replace function public.record_impressions(p_items jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 60 then
    return 0;
  end if;
  insert into public.offer_impressions as t (day, offer_id, shelf, position_bucket, impressions)
  select (now() at time zone 'America/Sao_Paulo')::date, x.o, x.s, x.p::smallint, count(*)
  from jsonb_to_recordset(p_items) as x(o uuid, s text, p integer)
  where x.s ~ '^[a-z0-9-]{1,40}$'
    and x.p between 0 and 17
    and exists (select 1 from public.offers o where o.id = x.o)
  group by 1, 2, 3, 4
  on conflict (day, offer_id, shelf, position_bucket)
  do update set impressions = t.impressions + excluded.impressions;
  get diagnostics n = row_count;
  return n;
exception when invalid_text_representation then
  return 0;
end
$$;

revoke all on function public.record_impressions(jsonb) from public;
grant execute on function public.record_impressions(jsonb) to anon, authenticated;

-- Clicks also keep the list and the position range they came from.
alter table public.offer_clicks add column if not exists shelf text;
alter table public.offer_clicks add column if not exists position_bucket smallint;

drop function if exists public.record_click(uuid, text);
create or replace function public.record_click(
  p_offer uuid,
  p_origin text,
  p_shelf text default null,
  p_position integer default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_origin is null or p_origin not in ('home', 'busca', 'categoria', 'produto', 'outro') then
    return false;
  end if;
  -- Same offer: at most 10 clicks a minute. Whole site: at most 300 a minute.
  if (select count(*) from public.offer_clicks where offer_id = p_offer and clicked_at > now() - interval '1 minute') >= 10 then
    return false;
  end if;
  if (select count(*) from public.offer_clicks where clicked_at > now() - interval '1 minute') >= 300 then
    return false;
  end if;
  insert into public.offer_clicks (offer_id, origin, shelf, position_bucket)
  values (
    p_offer,
    p_origin,
    case when p_shelf ~ '^[a-z0-9-]{1,40}$' then p_shelf end,
    case when p_position between 0 and 17 then p_position::smallint end
  );
  return true;
exception when foreign_key_violation then
  return false;
end
$$;

revoke all on function public.record_click(uuid, text, text, integer) from public;
grant execute on function public.record_click(uuid, text, text, integer) to anon, authenticated;

-- For the owner only (no grant to the public keys): exibições, clicks and CTR per list and position,
-- last 7 days. In the database panel: select * from public.shelf_ctr_7d order by impressions desc;
create or replace view public.shelf_ctr_7d with (security_invoker = true) as
with imp as (
  select shelf, position_bucket, sum(impressions)::bigint as impressions
  from public.offer_impressions
  where day >= (now() at time zone 'America/Sao_Paulo')::date - 7
  group by 1, 2
),
clk as (
  select shelf, position_bucket, count(*)::bigint as clicks
  from public.offer_clicks
  where clicked_at >= now() - interval '7 days' and shelf is not null
  group by 1, 2
)
select
  coalesce(imp.shelf, clk.shelf) as shelf,
  coalesce(imp.position_bucket, clk.position_bucket) as position_bucket,
  coalesce(imp.impressions, 0) as impressions,
  coalesce(clk.clicks, 0) as clicks,
  round(100.0 * coalesce(clk.clicks, 0) / nullif(imp.impressions, 0), 2) as ctr_percent
from imp
full join clk on imp.shelf = clk.shelf and imp.position_bucket = clk.position_bucket;

revoke all on public.shelf_ctr_7d from anon, authenticated;

notify pgrst, 'reload schema';
