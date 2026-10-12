-- Dermocosmetics and herbs/natural products get their own categories (collected once a day by engine-nichos.yml).
insert into public.categories (slug, name)
values
  ('dermocosmeticos', 'Dermocosméticos'),
  ('ervas-naturais', 'Ervas e Produtos Naturais')
on conflict (slug) do nothing;
