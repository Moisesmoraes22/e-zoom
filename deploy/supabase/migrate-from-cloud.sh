#!/usr/bin/env bash
# Copia o banco do Supabase na nuvem para o Supabase desta VPS: esquema e dados do schema public
# (ofertas, historico de precos, favoritos, cupons...), contas (auth.users/identities) e os buckets.
# A URL de conexao e digitada aqui e nao fica gravada em lugar nenhum.
set -euo pipefail

DUMP=/opt/supabase/cloud-dump
mkdir -p "$DUMP"
echo "Cole a URL de conexao do banco ANTIGO (Supabase -> Connect -> Session pooler, com a senha). Nao aparece na tela."
read -rsp "URL: " SRC; echo
[ -n "$SRC" ] || { echo "URL vazia"; exit 1; }

PG=postgres:17
run_dump() { docker run --rm -e SRC="$SRC" -v "$DUMP:/dump" "$PG" sh -c "$1"; }

echo "1/4 Baixando o schema public (esquema + dados)..."
run_dump 'pg_dump "$SRC" --schema=public --no-owner -Fc -f /dump/public.dump'
echo "2/4 Baixando contas e buckets..."
run_dump 'pg_dump "$SRC" --data-only --column-inserts --on-conflict-do-nothing -t auth.users -t auth.identities -f /dump/auth.sql'
run_dump 'pg_dump "$SRC" --data-only --column-inserts --on-conflict-do-nothing -t storage.buckets -f /dump/buckets.sql'

echo "3/4 Restaurando no banco novo (avisos de 'already exists' sao normais)..."
docker exec -i supabase-db pg_restore -U postgres -d postgres --no-owner --schema=public < "$DUMP/public.dump" 2>&1 | tail -n 15 || true
for f in auth buckets; do
  docker exec -i supabase-db psql -U postgres -d postgres -q < "$DUMP/$f.sql" 2>&1 | tail -n 5 || true
done

echo "4/4 Conferindo:"
docker exec -i supabase-db psql -U postgres -d postgres -At -c "
select 'offers', count(*) from public.offers
union all select 'price_history', count(*) from public.price_history
union all select 'favorites', count(*) from public.favorites
union all select 'coupons', count(*) from public.coupons
union all select 'auth.users', count(*) from auth.users
union all select 'buckets', count(*) from storage.buckets;"
echo
echo "Pronto. Os arquivos em $DUMP contem dados de usuarios: apague depois de conferir (rm -rf $DUMP)."
