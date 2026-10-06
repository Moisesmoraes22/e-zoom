-- Click totals per offer for ranking. The raw table stays unreadable through the API;
-- this returns only counts (no personal data exists in it), for offers with at least 2 clicks.
create or replace function public.offer_click_counts(days integer default 14)
returns table (offer_id uuid, clicks integer)
language sql
security definer
set search_path = public
stable
as $$
  select offer_id, count(*)::integer
  from public.offer_clicks
  where clicked_at > now() - make_interval(days => least(greatest(days, 1), 90))
  group by offer_id
  having count(*) >= 2
$$;

revoke all on function public.offer_click_counts(integer) from public;
grant execute on function public.offer_click_counts(integer) to anon, authenticated;
