alter table public.offers add column if not exists popularity integer;
comment on column public.offers.popularity is 'Store-reported popularity (Shopee: feed likes / API sales). Null when the source has none.';
