-- Phone accessories (cases, films, chargers, cables, holders) get their own category, so
-- "Celulares" lists the phones themselves. The product page of a phone suggests them.
insert into public.categories (slug, name)
values ('acessorios-celular', 'Acessórios para Celular')
on conflict (slug) do nothing;
