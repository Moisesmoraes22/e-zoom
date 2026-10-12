-- Complete assembled PCs (gamer, office, mini, all-in-one) get their own category, shown right after
-- Electronics: the niche the site invests in.
insert into public.categories (slug, name)
values ('pc-completo', 'PC Completo Montado')
on conflict (slug) do nothing;
