#!/usr/bin/env bash
# Aponta o site (nesta VPS) para o Supabase proprio e republica. Depois de migrate-from-cloud.sh.
set -euo pipefail
S=/opt/supabase/.env
E=/opt/ezooom/deploy/.env
val() { grep "^$1=" "$S" | head -n1 | cut -d= -f2-; }
URL="$(val SUPABASE_PUBLIC_URL)"
PUB="$(val SUPABASE_PUBLISHABLE_KEY)"
[ -n "$PUB" ] || PUB="$(val ANON_KEY)"

setenv() { if grep -q "^$1=" "$E"; then sed -i "s|^$1=.*|$1=$2|" "$E"; else echo "$1=$2" >> "$E"; fi }
setenv NEXT_PUBLIC_SUPABASE_URL "$URL"
setenv NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY "$PUB"

bash /opt/ezooom/deploy/deploy.sh

echo
echo "Site apontando para $URL."
echo
echo "FALTA: as coletas do GitHub Actions. No GitHub (Settings -> Secrets and variables -> Actions) troque:"
echo "  SUPABASE_URL         = $URL"
echo "  SUPABASE_SECRET_KEY  = (valor de SUPABASE_SECRET_KEY em $S)"
