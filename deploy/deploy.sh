#!/usr/bin/env bash
# Atualiza o site: baixa o codigo novo, reconstroi a imagem e troca o container sem derrubar o antigo antes.
set -euo pipefail
cd "$(dirname "$0")/.."
git pull --ff-only origin main
cd deploy
# Chave que cifra as credenciais do n8n: criada uma vez e nunca trocada (trocar perde as credenciais salvas).
grep -q '^N8N_ENCRYPTION_KEY=' .env || echo "N8N_ENCRYPTION_KEY=$(openssl rand -hex 24)" >> .env
docker compose up -d --build
# O Caddyfile e um arquivo montado: se mudou, o container nao recria sozinho, entao recarrega a configuracao.
docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile || docker compose restart caddy
docker image prune -f >/dev/null
echo "OK: $(git rev-parse --short HEAD) no ar"
