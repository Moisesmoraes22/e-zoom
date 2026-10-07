alter table public.offers add column if not exists seller_state text;
alter table public.offers add column if not exists seller_city text;
comment on column public.offers.seller_state is 'State of the seller of the listed offer (Mercado Livre: seller_address.state.name). Null when the source does not give it.';
comment on column public.offers.seller_city is 'City of the seller of the listed offer (Mercado Livre: seller_address.city.name). Null when the source does not give it.';
