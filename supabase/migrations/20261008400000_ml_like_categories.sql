-- Categories like Mercado Livre's own root categories (same names), plus our niches. "calcados" joins
-- "moda" (the marketplace has one "Calçados, Roupas e Bolsas") and "infantil" splits into "bebes" and
-- "brinquedos". Existing offers are moved; the next collections refile the rest by the marketplace's tree.

insert into public.categories (slug, name) values
  ('eletronicos', 'Eletrônicos, Áudio e Vídeo'),
  ('informatica', 'Informática'),
  ('celulares', 'Celulares e Telefones'),
  ('casa', 'Casa, Móveis e Decoração'),
  ('eletrodomesticos', 'Eletrodomésticos'),
  ('moda', 'Calçados, Roupas e Bolsas'),
  ('beleza', 'Beleza e Cuidado Pessoal'),
  ('saude', 'Saúde'),
  ('esporte', 'Esportes e Fitness'),
  ('games', 'Games'),
  ('bebes', 'Bebês'),
  ('brinquedos', 'Brinquedos e Hobbies'),
  ('acessorios-veiculos', 'Acessórios para Veículos'),
  ('agro', 'Agro'),
  ('alimentos-bebidas', 'Alimentos e Bebidas'),
  ('animais', 'Animais'),
  ('antiguidades', 'Antiguidades e Coleções'),
  ('arte-papelaria', 'Arte, Papelaria e Armarinho'),
  ('cameras', 'Câmeras e Acessórios'),
  ('construcao', 'Construção'),
  ('ferramentas', 'Ferramentas'),
  ('festas', 'Festas e Lembrancinhas'),
  ('industria', 'Indústria e Comércio'),
  ('instrumentos', 'Instrumentos Musicais'),
  ('joias-relogios', 'Joias e Relógios'),
  ('livros', 'Livros, Revistas e Comics'),
  ('musica-filmes', 'Música, Filmes e Seriados')
on conflict (slug) do update set name = excluded.name;

update public.offers set category_slug = 'moda' where category_slug = 'calcados';
update public.offers
   set category_slug = case
     when title ~* '(fralda|mamadeira|babador|beb[eê]|chupeta|rec[eé]m[- ]nascid|berço|carrinho de beb)' then 'bebes'
     else 'brinquedos'
   end
 where category_slug = 'infantil';

delete from public.categories where slug in ('calcados', 'infantil');
