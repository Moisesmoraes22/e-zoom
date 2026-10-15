-- Graphics cards get their own category (collected once a day by engine-nichos.yml).
insert into public.categories (slug, name)
values ('placas-de-video', 'Placas de Vídeo')
on conflict (slug) do nothing;
