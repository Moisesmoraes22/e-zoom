-- Clicks used to be inserted straight into the table by the public (anon) key, which sits in every
-- visitor's browser: anyone could fill it and inflate the "most clicked" ranking while skipping the
-- site's limiter. The insert now goes through this function, which validates the input and caps the
-- volume in the database itself (shared by every server instance). The direct insert grant is
-- removed by the next migration, after the site has switched to the function.
create or replace function public.record_click(p_offer uuid, p_origin text)
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
  insert into public.offer_clicks (offer_id, origin) values (p_offer, p_origin);
  return true;
exception when foreign_key_violation then
  return false;
end
$$;

revoke all on function public.record_click(uuid, text) from public;
grant execute on function public.record_click(uuid, text) to anon, authenticated;
