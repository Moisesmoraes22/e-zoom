#!/usr/bin/env bash
# Atualiza o site: baixa o codigo novo, reconstroi a imagem e troca o container sem derrubar o antigo antes.
set -euo pipefail
cd "$(dirname "$0")/.."
git pull --ff-only origin main
cd deploy
docker compose up -d --build
docker image prune -f >/dev/null
echo "OK: $(git rev-parse --short HEAD) no ar"
