-- Perfumes (Arabian, Natura, O Boticário and the like) get their own category, out of "Beleza".
insert into public.categories (slug, name)
values ('perfumes', 'Perfumes e Fragrâncias')
on conflict (slug) do nothing;
