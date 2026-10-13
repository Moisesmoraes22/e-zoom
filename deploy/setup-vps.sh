#!/usr/bin/env bash
# Primeira instalacao no servidor (Ubuntu 24.04, como root). Seguro rodar de novo.
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

apt-get update -y
apt-get install -y ca-certificates curl git ufw fail2ban
command -v docker >/dev/null || curl -fsSL https://get.docker.com | sh

# Firewall: so SSH, HTTP e HTTPS.
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
systemctl enable --now fail2ban

# Codigo (repositorio publico).
[ -d /opt/ezooom/.git ] || git clone https://github.com/Moisesmoraes22/e-zoom.git /opt/ezooom
cd /opt/ezooom

# Valores publicos (URL e chave publicavel do Supabase), nada secreto.
cat > deploy/.env <<ENV
NEXT_PUBLIC_SUPABASE_URL=https://cvisycdcnrjcrxlexldc.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_nXesii2dkO6Y5yEeTvjQuA_ddRV7OQI
NEXT_PUBLIC_SITE_URL=https://ezooom.com.br
ENV

bash deploy/deploy.sh
