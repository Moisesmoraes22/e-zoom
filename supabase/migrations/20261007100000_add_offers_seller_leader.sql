alter table public.offers add column if not exists seller_leader text;
comment on column public.offers.seller_leader is 'Mercado Livre seller badge of the listed offer (MercadoLider): silver, gold or platinum. Null when the seller has none or the source does not give it.';
