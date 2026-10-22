-- Script unico (nao e migracao): bloqueia 86 ofertas que os termos do programa de afiliados do Mercado Livre
-- ou o dono pediram para ficar de fora (usados, recondicionados, lubrificantes, doces e salgados, narguile, airsoft, curso).
-- Rode uma vez na VPS:
--   docker exec -i supabase-db psql -U postgres -d postgres < /opt/ezooom/supabase/manual/bloquear-ofertas-2026-10-22.sql
-- Seguro de repetir: 'on conflict do nothing'. As ofertas saem do site na proxima coleta (a cada 30 min) e nao voltam.
begin;
-- usado_ou_recondicionado: 53 ofertas
insert into public.blocked_offers (store_id, external_id, reason)
select store_id, external_id, 'Produto usado ou recondicionado (termos do programa de afiliados do Mercado Livre: so produtos novos)' from public.offers
where id in (
  '036bab62-06f9-40ab-a34c-54d38eb7ec93',
  '036f3d6c-3fd5-4e52-812e-b7f06f310d19',
  '04d063df-c9bf-4494-a351-d2c100549e31',
  '0567f47e-fb38-4a2c-aa7c-3e1ccae4fef3',
  '0c4b5554-d12c-45d0-b063-30c73be4fdf0',
  '117b366c-a0c5-4149-bad2-4ba1f3c5685c',
  '12dbbb9c-3b5f-4018-9167-58e6fa1fd821',
  '1b4342f2-e489-4715-aaaf-fd135deb545d',
  '21d11dec-e89f-49f8-814f-cf9f2b4f6ba1',
  '2230fb97-9cae-4ab0-a3ba-cde508042c30',
  '235fbf73-a74e-45fb-8f9a-8783c96c603f',
  '269aa23f-8fc8-4943-a891-24e21f609e90',
  '30323ddb-5565-454b-a5e5-3f58bf8cbf92',
  '316e67e3-e289-4e31-b36e-311da9c826a1',
  '467ec1fe-721e-480e-a271-c0d293d67db6',
  '5b7c34db-2e19-4cec-9a65-d2a3af96a049',
  '6bbfe285-e112-49e5-af08-6c7d47b41cb0',
  '70cd8cc0-0469-4fa6-9df0-d6582062c907',
  '72b69b78-a833-4123-8602-e535302d8b1c',
  '72c5f2a0-4ea4-4aec-877f-2ffae6586301',
  '74968a8d-03ff-49d9-8772-28beeabd4232',
  '76899af1-7833-4b06-bb5e-a2f1ca1a0a8e',
  '7e7c3fdb-36f0-46a9-8784-67e993579126',
  '820fb406-9c90-46a6-81f2-ad1f6fac6b08',
  '8656225a-73f4-4035-b9bd-9d581fccf927',
  '8871c72f-d115-4cac-8211-fb3cce8c6efb',
  '8abff0d7-c898-42c2-a3f2-4aad76578592',
  '95567c2e-40c0-4a01-aea1-dc6f86869bec',
  '99a2be51-6427-4020-9617-b66eb32569fd',
  '9adeb627-18f8-48bb-8f5e-bdeb1efe761b',
  '9ed8849f-59b4-41a9-be4c-34ececb9e8e8',
  'a3980e87-a2f5-4975-9450-4bc3eab6f63f',
  'a4c0b60b-bd32-4425-ac5a-60736f4ccabf',
  'a88e6f60-0aee-4620-ae34-48b7dc778c78',
  'a9170b40-3f60-4829-bffb-b2a47dcde4ec',
  'b320ff6b-a246-4109-9684-ef5983173722',
  'b5465f6d-4110-4d6a-942e-df91002a2e60',
  'b7039aa7-9227-45ff-b03f-be60fc5beee5',
  'ba311161-ce5d-44eb-a127-e0503eb9fdf8',
  'c28a478c-8dac-4800-8637-1770a2f22820',
  'c60aab42-b5d1-44b6-8a4b-e0c94c216ad0',
  'c7fa3eab-d077-40c8-afb5-363355cc83ad',
  'cb1a3b70-d861-4bec-b965-315dcd2cd1ac',
  'cdded3cf-df64-4942-9fce-38b3ee5c3e02',
  'd6f3211b-73b7-4d0a-a090-0ce6bae34e82',
  'e0487815-d5d0-46f1-8658-ce7768afd251',
  'ed526a56-1844-407a-a9f2-0b074282c486',
  'ee00d218-5173-4b74-8dd0-404acbb2475d',
  'ee7e3f53-54c8-4953-b743-5bdbee97810a',
  'f4792376-b6f0-4b73-8946-b349f8847d15',
  'f5fc0b20-4df5-492a-baa0-d8b486683938',
  'f9e4a832-be61-4f9b-b991-b4e381ff5d67',
  'ffb1f224-9882-49cc-9539-a407bbb65f2d'
)
on conflict (store_id, external_id) do nothing;
-- adulto_lubrificante: 3 ofertas
insert into public.blocked_offers (store_id, external_id, reason)
select store_id, external_id, 'Lubrificante intimo / produto adulto (voce pediu para ficar de fora)' from public.offers
where id in (
  'b1d92f67-ede9-4219-8eb1-d4b35894f4af',
  'c4fa5965-83ba-4c9c-ae17-6dbb8665fe21',
  'cfc6aa1f-9822-42df-8dc7-c232132f8634'
)
on conflict (store_id, external_id) do nothing;
-- doce_salgado_alimento: 14 ofertas
insert into public.blocked_offers (store_id, external_id, reason)
select store_id, external_id, 'Doce / salgado / alimento (voce pediu para ficar de fora)' from public.offers
where id in (
  '02e9152f-2adf-454a-9e22-605ae018e214',
  '12477c01-be64-44bc-af2c-142e8dfd842f',
  '2426c7dd-186d-4c6d-931f-6cada5ef6a93',
  '2e95fc02-c2cf-463c-a529-89384603cef8',
  '5be575dc-df91-4a62-9549-e95119d11f80',
  'a91e8e1e-5a0f-4acc-97b1-2fd3c75de904',
  'b33118fe-73f4-44eb-bfc0-855a52be948c',
  'cd5f5749-4b4b-4469-a2e1-a878b4fa6f4f',
  'd7bbc0cb-1805-47c4-9db9-d65b668c7eff',
  'dd83f0fd-8807-4ed5-a88a-1cf492fd4a01',
  'e061a92f-70fa-4dae-9882-a280b2748563',
  'ef01deb5-7284-45c4-abc2-f652766d3922',
  'efc9bcb8-9663-4896-8942-adee4f47151d',
  'fe4b5590-b9b4-4a09-bd0b-0a11a525f6b2'
)
on conflict (store_id, external_id) do nothing;
-- narguile_tabaco_alcool: 13 ofertas
insert into public.blocked_offers (store_id, external_id, reason)
select store_id, external_id, 'Narguile / tabaco / bebida alcoolica (itens controlados)' from public.offers
where id in (
  '05ab23f4-1b33-44fe-8c79-b222d6d65217',
  '19cd1816-2442-4ef2-8347-36e281c42532',
  '427079bc-bc14-476a-a7ac-8171e1656100',
  '4d6674c6-7f7f-49f0-a4c8-6277796d74c2',
  '504bd988-516b-45e7-a475-c0876f4cd591',
  '57d829cc-3ae2-4dac-9a7a-9d33ab7f1c55',
  '62cf6474-f83f-444d-9a63-9f6e940eb29a',
  '64d01572-50a6-4d6a-a090-eac2812b56c6',
  '8c8fea9d-ffab-426b-bfdb-55325550a024',
  '9f16cf36-f6f2-4c80-a3d7-c149d5bdacfd',
  'd7b11e55-7c13-48f5-ad4b-ab75ca25e992',
  'de197a5a-4a8a-48f9-8008-b7e958718fb2',
  'fa383ba1-36a2-4579-bdb7-899d55b5e193'
)
on conflict (store_id, external_id) do nothing;
-- arma_airsoft: 2 ofertas
insert into public.blocked_offers (store_id, external_id, reason)
select store_id, external_id, 'Arma de pressao / airsoft (itens controlados)' from public.offers
where id in (
  'a16b4d5d-5b58-4b27-92f0-62a4fde970d3',
  'f1cc6d08-df14-481d-8902-3c7f059db5c4'
)
on conflict (store_id, external_id) do nothing;
-- curso_ou_servico: 1 ofertas
insert into public.blocked_offers (store_id, external_id, reason)
select store_id, external_id, 'Curso / servico (produto fisico apenas)' from public.offers
where id in (
  'e3231da9-6bf1-48c4-8bc4-1457cc1aab0f'
)
on conflict (store_id, external_id) do nothing;
commit;

-- Conferencia:
select reason, count(*) from public.blocked_offers group by reason order by 2 desc;
