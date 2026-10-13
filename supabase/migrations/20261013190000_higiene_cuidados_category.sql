-- Personal hygiene (oral care, soap, deodorant, pads, shaving) gets its own category.
insert into public.categories (slug, name)
values ('higiene-cuidados', 'Higiene e Cuidados')
on conflict (slug) do nothing;
