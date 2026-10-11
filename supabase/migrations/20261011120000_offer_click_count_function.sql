-- Clicks on "Ver oferta" for ONE offer in the last N days (counts only). The product page shows
-- "aberta N vezes"; offer_click_counts (all offers, 2+ clicks) is too wide to call per page.
create or replace function public.offer_click_count(p_offer uuid, p_days integer default 14)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.offer_clicks
  where offer_id = p_offer
    and clicked_at > now() - make_interval(days => least(greatest(p_days, 1), 90));
$$;

revoke all on function public.offer_click_count(uuid, integer) from public;
grant execute on function public.offer_click_count(uuid, integer) to anon, authenticated;
