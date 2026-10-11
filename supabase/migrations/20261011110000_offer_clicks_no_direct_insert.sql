-- Run after the site records clicks through public.record_click (previous migration).
drop policy if exists offer_clicks_insert on public.offer_clicks;
revoke insert on public.offer_clicks from anon;
