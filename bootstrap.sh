#!/usr/bin/env bash
# =============================================================================
#  DevilEye — Bootstrap Completo (VPS Hostinger KVM 4 / Ubuntu 22.04+)
#  Uso: curl -fsSL https://raw.githubusercontent.com/darkthegod-pilot/DevilEye/main/bootstrap.sh | bash
#  Ou:  wget -qO- https://raw.githubusercontent.com/darkthegod-pilot/DevilEye/main/bootstrap.sh | bash
# =============================================================================
set -eo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; DIM='\033[2m'; RESET='\033[0m'
CHECK="${GREEN}✓${RESET}"; CROSS="${RED}✗${RESET}"

REPO_URL="https://github.com/darkthegod-pilot/DevilEye.git"
INSTALL_DIR="/var/www/devileye"
NODE_MIN=18

ok()   { echo -e "  ${CHECK} $1"; }
warn() { echo -e "  ${YELLOW}⚠  $1${RESET}"; }
err()  { echo -e "  ${CROSS} ${RED}$1${RESET}"; }
die()  { err "$1"; exit 1; }
step() { echo -e "\n${BOLD}[${CYAN}$1${RESET}${BOLD}]${RESET} $2"; }

echo -e ""
echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${CYAN}║        🔍  DevilEye — Bootstrap Installer        ║${RESET}"
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════╝${RESET}"
echo -e ""

# ---------------------------------------------------------------------------
# STEP 1 — Pré-requisitos do sistema
# ---------------------------------------------------------------------------
step "1/6" "Verificando pré-requisitos do sistema..."

# Node.js
if command -v node &>/dev/null; then
  NODE_VER=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
  if [[ "$NODE_VER" -lt "$NODE_MIN" ]]; then
    warn "Node.js v${NODE_VER} encontrado, mas é necessário v${NODE_MIN}+. Instalando via nvm..."
    INSTALL_NODE=true
  else
    ok "Node.js $(node -v)"
    INSTALL_NODE=false
  fi
else
  warn "Node.js não encontrado. Instalando via nvm..."
  INSTALL_NODE=true
fi

if [[ "$INSTALL_NODE" == true ]]; then
  export NVM_DIR="$HOME/.nvm"
  if [[ ! -d "$NVM_DIR" ]]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  fi
  # shellcheck source=/dev/null
  # Disable -u temporarily to avoid nvm unbound variable issues
  set +u
  source "$NVM_DIR/nvm.sh"
  nvm install 20
  nvm use 20
  nvm alias default 20
  set -u
  ok "Node.js $(node -v) instalado via nvm"
fi

# npm
command -v npm &>/dev/null && ok "npm $(npm -v)" || die "npm não encontrado após instalar Node.js"

# Git
command -v git &>/dev/null && ok "git $(git --version | awk '{print $3}')" || die "git não encontrado — instale com: apt-get install -y git"

# PM2
if ! command -v pm2 &>/dev/null; then
  echo -e "  ${DIM}→ Instalando PM2 globalmente...${RESET}"
  npm install -g pm2 --silent
  ok "PM2 $(pm2 -v) instalado"
else
  ok "PM2 $(pm2 -v)"
fi

# ---------------------------------------------------------------------------
# STEP 2 — Clonar repositório
# ---------------------------------------------------------------------------
step "2/6" "Clonando repositório DevilEye..."

if [[ -d "$INSTALL_DIR/.git" ]]; then
  warn "Diretório $INSTALL_DIR já existe. Atualizando com git pull..."
  git -C "$INSTALL_DIR" pull --ff-only origin main || {
    warn "git pull falhou. Fazendo reset para HEAD remoto..."
    git -C "$INSTALL_DIR" fetch origin main
    git -C "$INSTALL_DIR" reset --hard origin/main
  }
  ok "Repositório atualizado"
else
  mkdir -p "$(dirname "$INSTALL_DIR")"
  git clone "$REPO_URL" "$INSTALL_DIR"
  ok "Repositório clonado em $INSTALL_DIR"
fi

cd "$INSTALL_DIR"

# ---------------------------------------------------------------------------
# STEP 3 — Configurar variáveis de ambiente
# ---------------------------------------------------------------------------
step "3/6" "Configurando variáveis de ambiente..."

if [[ ! -f "backend/.env" ]]; then
  cp backend/.env.example backend/.env

  # Gera JWT_SECRET aleatório de 64 chars
  JWT_SECRET=$(node -e "require('crypto').randomBytes(32).toString('hex')" 2>/dev/null || \
               openssl rand -hex 32 2>/dev/null || \
               cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 64 | head -n 1)

  # Pergunta o domínio
  echo ""
  read -rp "  Digite seu domínio (ex: meusite.com) [Enter para pular]: " DOMAIN
  DOMAIN="${DOMAIN:-localhost}"

  # Atualiza .env
  sed -i "s|JWT_SECRET=.*|JWT_SECRET=\"${JWT_SECRET}\"|" backend/.env
  sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=\"https://${DOMAIN}\"|" backend/.env
  sed -i "s|DATABASE_URL=.*|DATABASE_URL=\"file:${INSTALL_DIR}/backend/prisma/devileye.db\"|" backend/.env
  sed -i "s|UPLOADS_DIR=.*|UPLOADS_DIR=\"${INSTALL_DIR}/backend/uploads\"|" backend/.env

  ok "backend/.env criado com JWT_SECRET aleatório"
  ok "Domínio configurado: $DOMAIN"
else
  ok "backend/.env já existe (mantido sem alterações)"
fi

mkdir -p backend/uploads backend/prisma
chmod 755 backend/uploads

# ---------------------------------------------------------------------------
# STEP 4 — Instalar dependências e migrar banco
# ---------------------------------------------------------------------------
step "4/6" "Instalando dependências e configurando banco de dados..."

echo -e "  ${DIM}→ npm install (backend)...${RESET}"
cd "$INSTALL_DIR/backend"
npm install --omit=dev --silent

echo -e "  ${DIM}→ Gerando Prisma client...${RESET}"
npx prisma generate --silent 2>/dev/null || npx prisma generate

echo -e "  ${DIM}→ Criando/migrando banco SQLite...${RESET}"
# shellcheck source=/dev/null
source "$INSTALL_DIR/backend/.env" 2>/dev/null || true
export DATABASE_URL

npx prisma migrate deploy 2>/dev/null || {
  warn "migrate deploy falhou, tentando db push..."
  npx prisma db push --accept-data-loss
}

echo -e "  ${DIM}→ Populando dados iniciais (seed)...${RESET}"
node prisma/seed.js && ok "Seed concluído (3 usuários + 8 casos de exemplo)" || warn "Seed falhou ou dados já existem"

cd "$INSTALL_DIR"
ok "Backend configurado"

# ---------------------------------------------------------------------------
# STEP 5 — Build do frontend
# ---------------------------------------------------------------------------
step "5/6" "Fazendo build do frontend..."

echo -e "  ${DIM}→ npm install (frontend)...${RESET}"
npm install --silent

echo -e "  ${DIM}→ npm run build...${RESET}"
VITE_BASE_URL="/devileye/" npm run build

DIST_SIZE=$(du -sh dist/ 2>/dev/null | cut -f1)
ok "Build concluído (dist/ — $DIST_SIZE)"

# Gera config Nginx se não existir
if [[ ! -f "nginx-devileye.conf" ]]; then
  cat > nginx-devileye.conf << NGINX
# Adicione este bloco dentro do seu server {} no Nginx
# Arquivo: /etc/nginx/sites-available/seu-dominio.conf

# Frontend (SPA React)
location /devileye/ {
    alias ${INSTALL_DIR}/dist/;
    try_files \$uri \$uri/ /devileye/index.html;
    
    # Cache agressivo para assets com hash
    location ~* \.(js|css|woff2?|png|jpg|svg|ico)\$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# API Backend (proxy para PM2/Node.js na porta 3001)
location /api/ {
    proxy_pass http://127.0.0.1:3001/api/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_cache_bypass \$http_upgrade;
}

# Uploads estáticos
location /uploads/ {
    alias ${INSTALL_DIR}/backend/uploads/;
    expires 30d;
    add_header Cache-Control "public";
}
NGINX
  ok "Config Nginx gerada em: ${INSTALL_DIR}/nginx-devileye.conf"
fi

# ---------------------------------------------------------------------------
# STEP 6 — Iniciar API com PM2
# ---------------------------------------------------------------------------
step "6/6" "Iniciando API com PM2..."

# Cria/atualiza ecosystem.config.js com caminhos absolutos
cat > "$INSTALL_DIR/ecosystem.config.js" << ECOSYSTEM
module.exports = {
  apps: [{
    name: 'devileye-api',
    script: '${INSTALL_DIR}/backend/src/server.js',
    cwd: '${INSTALL_DIR}',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '300M',
    env_file: '${INSTALL_DIR}/backend/.env',
    env: {
      NODE_ENV: 'production',
    }
  }]
}
ECOSYSTEM

if pm2 list | grep -q "devileye-api"; then
  pm2 reload devileye-api --update-env
  ok "PM2: devileye-api recarregado"
else
  pm2 start "$INSTALL_DIR/ecosystem.config.js" --env production
  ok "PM2: devileye-api iniciado"
fi

# Salvar lista PM2 para reiniciar no boot
pm2 save --force &>/dev/null
pm2 startup 2>/dev/null | grep -E "^sudo" | bash 2>/dev/null || true
ok "PM2 configurado para iniciar no boot"

# ---------------------------------------------------------------------------
# RESUMO FINAL
# ---------------------------------------------------------------------------
echo ""
echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${GREEN}║         ✓  DevilEye instalado com sucesso!       ║${RESET}"
echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════════════╝${RESET}"
echo ""
echo -e "  ${BOLD}API:${RESET}       http://localhost:3001/api/health"
echo -e "  ${BOLD}Frontend:${RESET}  https://${DOMAIN:-SEU_DOMINIO}/devileye/"
echo -e "  ${BOLD}Nginx cfg:${RESET} ${INSTALL_DIR}/nginx-devileye.conf"
echo ""
echo -e "  ${BOLD}${CYAN}Próximos passos:${RESET}"
echo -e "  1. Copie o bloco de ${INSTALL_DIR}/nginx-devileye.conf"
echo -e "     para dentro do seu server{} no Nginx"
echo -e "  2. Execute: ${DIM}sudo nginx -t && sudo systemctl reload nginx${RESET}"
echo -e "  3. Acesse: https://${DOMAIN:-SEU_DOMINIO}/devileye/"
echo ""
echo -e "  ${BOLD}Login padrão:${RESET}"
echo -e "  ${DIM}Usuário: carvalho | Senha: devileye123${RESET}"
echo -e "  ${DIM}Usuário: ana      | Senha: devileye123${RESET}"
echo ""
echo -e "  ${YELLOW}⚠  Troque as senhas em produção!${RESET}"
echo ""
