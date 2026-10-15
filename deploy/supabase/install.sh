#!/usr/bin/env bash
# Instala o Supabase proprio nesta VPS (Postgres, Auth, API REST, Storage e painel), a partir da pasta
# docker/ oficial da Supabase, e configura para o ezooom. Seguro rodar de novo. Roda como root.
#
# Antes: crie no Cloudflare o registro  A  api  ->  IP da VPS  (DNS only, nuvem cinza).
set -euo pipefail

DIR=/opt/supabase
API_HOST="${API_HOST:-api.ezooom.com.br}"
SITE="${SITE:-https://ezooom.com.br}"

mkdir -p /opt && cd /opt
if [ ! -f "$DIR/.env" ]; then
  curl -fsSL https://raw.githubusercontent.com/supabase/supabase/master/docker/setup.sh -o /tmp/supabase-setup.sh
  sh /tmp/supabase-setup.sh -y --project-dir supabase
fi
cd "$DIR"

setenv() { # setenv CHAVE VALOR (substitui ou acrescenta no .env)
  if grep -q "^$1=" .env; then sed -i "s|^$1=.*|$1=$2|" .env; else echo "$1=$2" >> .env; fi
}
setenv SUPABASE_PUBLIC_URL "https://$API_HOST"
setenv API_EXTERNAL_URL "https://$API_HOST/auth/v1"
setenv SITE_URL "$SITE"
setenv ADDITIONAL_REDIRECT_URLS "$SITE/**,https://www.ezooom.com.br/**"
setenv ENABLE_ANONYMOUS_USERS true
setenv DISABLE_SIGNUP false
setenv ENABLE_PHONE_SIGNUP false
# Porta no endereco interno do Docker (172.17.0.1): o Caddy, que roda em container, chega nela, e ela nao
# fica aberta para a internet. Em 127.0.0.1 o Caddy nao alcancaria.
setenv API_GW_HTTP_PORT 172.17.0.1:8000
setenv KONG_HTTP_PORT 172.17.0.1:8000
setenv COMPOSE_FILE docker-compose.yml:docker-compose.override.yml

# E-mail (confirmacao de conta, recuperar senha): SMTP do Resend, so se ainda nao estiver configurado.
if ! grep -q '^SMTP_HOST=smtp.resend.com' .env; then
  echo
  echo "E-mail de confirmacao: cole a chave de API do Resend (nao aparece na tela). Enter para pular."
  read -rsp "Chave do Resend: " RESEND_KEY; echo
  if [ -n "$RESEND_KEY" ]; then
    setenv SMTP_HOST smtp.resend.com
    setenv SMTP_PORT 465
    setenv SMTP_USER resend
    setenv SMTP_PASS "$RESEND_KEY"
    setenv SMTP_ADMIN_EMAIL no-reply@ezooom.com.br
    setenv SMTP_SENDER_NAME E-Zooom
  else
    echo "Pulado: sem SMTP, o cadastro por e-mail nao envia a confirmacao. Rode este script de novo quando tiver a chave."
  fi
fi

# O pooler (supavisor) publicaria o Postgres na internet, e o Docker passa por cima do firewall: fica sem portas.
cat > docker-compose.override.yml <<'YML'
services:
  supavisor:
    ports: !reset []
YML

docker compose up -d
echo
echo "Aguardando o banco ficar saudavel..."
for i in $(seq 1 60); do
  [ "$(docker inspect -f '{{.State.Health.Status}}' supabase-db 2>/dev/null)" = "healthy" ] && break
  sleep 5
done
docker compose ps --format 'table {{.Name}}\t{{.Status}}'
echo
echo "Supabase proprio no ar em http://172.17.0.1:8000 (https://$API_HOST depois do passo do Caddy)."
echo "Painel: https://$API_HOST  (usuario e senha em /opt/supabase/.env: DASHBOARD_USERNAME / DASHBOARD_PASSWORD)"
