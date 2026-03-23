#!/usr/bin/env bash
# =============================================================================
#  DevilEye — Bootstrap Installer v2
#  Uso: curl -fsSL https://raw.githubusercontent.com/darkthegod-pilot/DevilEye/main/bootstrap.sh | bash
# =============================================================================
set -eo pipefail

# --- Cores ---
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; DIM='\033[2m'; RESET='\033[0m'

# --- Constantes ---
REPO_URL="https://github.com/darkthegod-pilot/DevilEye.git"
INSTALL_DIR="/var/www/devileye"
NODE_MIN=18
NODE_TARGET=20
NVM_VERSION="v0.40.1"
API_PORT=3001

ok()    { echo -e "  ${GREEN}✓${RESET} $1"; }
warn()  { echo -e "  ${YELLOW}⚠${RESET}  $1"; }
err()   { echo -e "  ${RED}✗${RESET} ${RED}$1${RESET}"; }
die()   { err "$1"; echo ""; exit 1; }
step()  { echo -e "\n${BOLD}[${CYAN}$1${RESET}${BOLD}]${RESET} $2"; }
info()  { echo -e "  ${DIM}→ $1${RESET}"; }

# =============================================================================
banner() {
  echo ""
  echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════════════╗${RESET}"
  echo -e "${BOLD}${CYAN}║         DevilEye — Installer v2                     ║${RESET}"
  echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════════╝${RESET}"
  echo ""
}
banner

# =============================================================================
# STEP 0 — Verificação do sistema
# =============================================================================
step "0/6" "Verificando sistema..."

# Root
if [[ "$EUID" -ne 0 ]]; then
  warn "Não está rodando como root. Alguns passos podem falhar."
  warn "Recomendado: sudo bash bootstrap.sh"
fi

# OS
if [[ -f /etc/os-release ]]; then
  . /etc/os-release
  ok "OS: $NAME $VERSION_ID"
else
  warn "Não foi possível detectar o OS."
fi

# Arquitetura
ARCH=$(uname -m)
ok "Arquitetura: $ARCH"

# Disco disponível (mínimo 500MB)
DISK_AVAIL=$(df -BM "$INSTALL_DIR" 2>/dev/null | awk 'NR==2{gsub("M","",$4); print $4}' || \
             df -BM / | awk 'NR==2{gsub("M","",$4); print $4}')
if [[ -n "$DISK_AVAIL" && "$DISK_AVAIL" -lt 500 ]]; then
  die "Espaço insuficiente em disco: ${DISK_AVAIL}MB (mínimo 500MB)"
fi
ok "Disco disponível: ${DISK_AVAIL}MB"

# Memória disponível (mínimo 256MB)
MEM_AVAIL=$(awk '/MemAvailable/{printf "%d", $2/1024}' /proc/meminfo 2>/dev/null || echo "?")
if [[ "$MEM_AVAIL" != "?" && "$MEM_AVAIL" -lt 256 ]]; then
  warn "Memória disponível baixa: ${MEM_AVAIL}MB. O build pode falhar."
else
  ok "Memória disponível: ${MEM_AVAIL}MB"
fi

# Porta da API livre?
if command -v ss &>/dev/null; then
  if ss -tlnp 2>/dev/null | grep -q ":${API_PORT} "; then
    warn "Porta ${API_PORT} já está em uso. O PM2 pode recarregar a instância existente."
  else
    ok "Porta ${API_PORT} disponível"
  fi
fi

# Conectividade
if curl -fsSL --max-time 5 https://registry.npmjs.org/ &>/dev/null; then
  ok "Conectividade com internet: OK"
else
  die "Sem acesso à internet (npmjs.org inacessível). Verifique firewall/DNS."
fi

# =============================================================================
# STEP 1 — Dependências do sistema
# =============================================================================
step "1/6" "Verificando dependências do sistema..."

# Apt packages necessários
APT_NEEDED=()
for pkg in curl git openssl sqlite3; do
  command -v "$pkg" &>/dev/null || APT_NEEDED+=("$pkg")
done

if [[ ${#APT_NEEDED[@]} -gt 0 ]]; then
  info "Instalando via apt: ${APT_NEEDED[*]}"
  export DEBIAN_FRONTEND=noninteractive
  apt-get update -qq && apt-get install -y -qq "${APT_NEEDED[@]}"
fi

command -v curl   &>/dev/null && ok "curl   $(curl --version | head -1 | awk '{print $2}')"     || die "curl não encontrado"
command -v git    &>/dev/null && ok "git    $(git --version | awk '{print $3}')"                 || die "git não encontrado"
command -v openssl &>/dev/null && ok "openssl $(openssl version | awk '{print $2}')"             || warn "openssl não encontrado (JWT_SECRET via /dev/urandom)"
command -v sqlite3 &>/dev/null && ok "sqlite3 $(sqlite3 --version | awk '{print $1}')"          || warn "sqlite3 CLI não encontrado (não impede a instalação)"

# --- Node.js ---
INSTALL_NODE=false
if command -v node &>/dev/null; then
  NODE_VER=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
  if [[ "$NODE_VER" -lt "$NODE_MIN" ]]; then
    warn "Node.js v${NODE_VER} encontrado — necessário v${NODE_MIN}+. Atualizando via nvm..."
    INSTALL_NODE=true
  else
    ok "Node.js $(node -v)"
  fi
else
  warn "Node.js não encontrado. Instalando via nvm..."
  INSTALL_NODE=true
fi

if [[ "$INSTALL_NODE" == true ]]; then
  export NVM_DIR="$HOME/.nvm"
  if [[ ! -d "$NVM_DIR" ]]; then
    info "Baixando nvm ${NVM_VERSION}..."
    curl -o- "https://raw.githubusercontent.com/nvm-sh/nvm/${NVM_VERSION}/install.sh" | bash
  fi
  # nvm usa variáveis opcionais internamente; desabilitar -u temporariamente
  set +u
  # shellcheck source=/dev/null
  source "$NVM_DIR/nvm.sh" --no-use
  info "Instalando Node.js ${NODE_TARGET} LTS..."
  nvm install "${NODE_TARGET}"
  nvm use "${NODE_TARGET}"
  nvm alias default "${NODE_TARGET}"
  set -u
  # Garantir que node/npm estão no PATH desta sessão
  export PATH="$NVM_DIR/versions/node/$(nvm version)/bin:$PATH"
  ok "Node.js $(node -v) instalado via nvm"
fi

command -v npm &>/dev/null || die "npm não encontrado após instalar Node.js"
ok "npm $(npm -v)"

# --- PM2 ---
if ! command -v pm2 &>/dev/null; then
  info "Instalando PM2 globalmente..."
  npm install -g pm2 --silent --no-fund --no-audit
  ok "PM2 $(pm2 -v) instalado"
else
  ok "PM2 $(pm2 -v)"
fi

# Nginx (opcional — apenas avisa se não encontrar)
if command -v nginx &>/dev/null; then
  ok "nginx $(nginx -v 2>&1 | grep -oP '[\d.]+')"
else
  warn "nginx não encontrado — instale manualmente para servir o frontend."
fi

# =============================================================================
# STEP 2 — Clonar / atualizar repositório
# =============================================================================
step "2/6" "Preparando repositório DevilEye..."

if [[ -d "$INSTALL_DIR/.git" ]]; then
  warn "Diretório $INSTALL_DIR já existe. Atualizando..."
  git -C "$INSTALL_DIR" fetch origin main --quiet
  git -C "$INSTALL_DIR" reset --hard origin/main --quiet
  ok "Repositório atualizado para origin/main"
else
  mkdir -p "$(dirname "$INSTALL_DIR")"
  git clone --depth=1 "$REPO_URL" "$INSTALL_DIR"
  ok "Repositório clonado em $INSTALL_DIR"
fi

cd "$INSTALL_DIR"

# =============================================================================
# STEP 3 — Variáveis de ambiente
# =============================================================================
step "3/6" "Configurando variáveis de ambiente..."

if [[ ! -f "backend/.env" ]]; then
  cp backend/.env.example backend/.env

  # JWT_SECRET aleatório
  if command -v openssl &>/dev/null; then
    JWT_SECRET=$(openssl rand -hex 32)
  else
    JWT_SECRET=$(tr -dc 'a-zA-Z0-9' < /dev/urandom | fold -w 64 | head -n 1)
  fi

  # Domínio
  echo ""
  if [[ -t 0 ]]; then
    read -rp "  Digite seu domínio (ex: meusite.com) [Enter = localhost]: " DOMAIN
  fi
  DOMAIN="${DOMAIN:-localhost}"

  # Caminhos absolutos no .env
  sed -i "s|JWT_SECRET=.*|JWT_SECRET=\"${JWT_SECRET}\"|"                           backend/.env
  sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=\"https://${DOMAIN}\"|"                   backend/.env
  sed -i "s|DATABASE_URL=.*|DATABASE_URL=\"file:${INSTALL_DIR}/backend/prisma/devileye.db\"|" backend/.env
  sed -i "s|UPLOADS_DIR=.*|UPLOADS_DIR=\"${INSTALL_DIR}/backend/uploads\"|"        backend/.env

  ok "backend/.env criado"
  ok "JWT_SECRET aleatório gerado"
  ok "Domínio: ${DOMAIN}"
else
  ok "backend/.env já existe (sem alterações)"
  # Detectar domínio existente para o resumo final
  DOMAIN=$(grep -oP 'FRONTEND_URL=.*?//\K[^"]+' backend/.env 2>/dev/null || echo "localhost")
fi

mkdir -p backend/uploads backend/prisma
chmod 755 backend/uploads

# =============================================================================
# STEP 4 — Dependências e banco de dados
# =============================================================================
step "4/6" "Instalando dependências e configurando banco..."

# Backend
info "npm install (backend)..."
cd "$INSTALL_DIR/backend"
npm install --omit=dev --silent --no-fund --no-audit

info "Gerando Prisma client..."
npx prisma generate 2>/dev/null

info "Migrando banco SQLite..."
# Carregar DATABASE_URL do .env para o ambiente
set -a; source "$INSTALL_DIR/backend/.env"; set +a
npx prisma migrate deploy 2>/dev/null || {
  warn "migrate deploy falhou — tentando db push..."
  npx prisma db push --accept-data-loss --skip-generate
}
ok "Banco de dados pronto: $(basename "$DATABASE_URL")"

info "Populando dados iniciais (seed)..."
node prisma/seed.js && ok "Seed: 3 usuários + 8 casos de exemplo" \
                     || warn "Seed pulado (dados já existem ou seed.js não encontrado)"

# Verificar DB
if [[ -f "${INSTALL_DIR}/backend/prisma/devileye.db" ]]; then
  DB_SIZE=$(du -sh "${INSTALL_DIR}/backend/prisma/devileye.db" | cut -f1)
  ok "SQLite: devileye.db ($DB_SIZE)"
else
  die "Banco de dados não foi criado. Verifique logs acima."
fi

cd "$INSTALL_DIR"

# =============================================================================
# STEP 5 — Build do frontend
# =============================================================================
step "5/6" "Fazendo build do frontend (React + Vite)..."

info "npm install (frontend)..."
npm install --silent --no-fund --no-audit

# Verificar se vite está disponível
if [[ ! -x "node_modules/.bin/vite" ]]; then
  die "vite não encontrado em node_modules/.bin/vite. npm install falhou?"
fi

info "vite build..."
VITE_BASE_URL="/devileye/" npm run build

# Verificar build
if [[ ! -d "dist" || -z "$(ls -A dist/)" ]]; then
  die "Build falhou: pasta dist/ vazia ou inexistente."
fi
DIST_SIZE=$(du -sh dist/ | cut -f1)
ok "Build concluído: dist/ ($DIST_SIZE)"

# Gerar config Nginx
cat > "${INSTALL_DIR}/nginx-devileye.conf" << NGINX
# ============================================================
# DevilEye — Nginx config
# Adicione este bloco dentro do seu server {} no arquivo:
# /etc/nginx/sites-available/seu-dominio.conf
#
# Depois execute:
#   sudo nginx -t && sudo systemctl reload nginx
# ============================================================

# Frontend (SPA React)
location /devileye/ {
    alias ${INSTALL_DIR}/dist/;
    try_files \$uri \$uri/ /devileye/index.html;
    location ~* \.(js|css|woff2?|png|jpg|svg|ico)\$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# API Backend
location /api/ {
    proxy_pass         http://127.0.0.1:${API_PORT}/api/;
    proxy_http_version 1.1;
    proxy_set_header   Upgrade \$http_upgrade;
    proxy_set_header   Connection 'upgrade';
    proxy_set_header   Host \$host;
    proxy_set_header   X-Real-IP \$remote_addr;
    proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto \$scheme;
    proxy_cache_bypass \$http_upgrade;
    proxy_read_timeout 60s;
}

# Uploads de arquivos
location /uploads/ {
    alias ${INSTALL_DIR}/backend/uploads/;
    expires 30d;
    add_header Cache-Control "public";
}
NGINX
ok "nginx-devileye.conf gerado em: ${INSTALL_DIR}/nginx-devileye.conf"

# Aplicar no nginx se possível
if command -v nginx &>/dev/null; then
  NGINX_CONF=$(nginx -T 2>/dev/null | grep -oP 'configuration file \K[^ ]+' | head -1 \
               || echo "/etc/nginx/nginx.conf")
  NGINX_CONF_DIR=$(dirname "$NGINX_CONF")

  if [[ -d "${NGINX_CONF_DIR}/conf.d" ]]; then
    # Detectar server block existente que inclua conf.d
    DEST="${NGINX_CONF_DIR}/conf.d/devileye.conf"
    warn "Nginx detectado — copie o bloco abaixo para dentro do seu server{}"
    warn "Ou edite manualmente: $DEST"
  fi
fi

# =============================================================================
# STEP 6 — PM2
# =============================================================================
step "6/6" "Iniciando API com PM2..."

cat > "${INSTALL_DIR}/ecosystem.config.cjs" << ECOSYSTEM
module.exports = {
  apps: [{
    name:               'devileye-api',
    script:             '${INSTALL_DIR}/backend/src/server.js',
    cwd:                '${INSTALL_DIR}/backend',
    instances:          1,
    autorestart:        true,
    watch:              false,
    max_memory_restart: '300M',
    env_file:           '${INSTALL_DIR}/backend/.env',
    env: {
      NODE_ENV: 'production',
      PORT:     '${API_PORT}',
    }
  }]
}
ECOSYSTEM

if pm2 list 2>/dev/null | grep -q "devileye-api"; then
  pm2 reload devileye-api --update-env
  ok "PM2: devileye-api recarregado"
else
  pm2 start "${INSTALL_DIR}/ecosystem.config.cjs"
  ok "PM2: devileye-api iniciado"
fi

pm2 save --force &>/dev/null
pm2 startup 2>/dev/null | grep -E "^sudo" | bash 2>/dev/null || true
ok "PM2 configurado para iniciar no boot"

# --- Health check ---
info "Aguardando API iniciar..."
sleep 2
API_OK=false
for i in 1 2 3 4 5; do
  if curl -fsSL --max-time 3 "http://localhost:${API_PORT}/api/health" &>/dev/null; then
    API_OK=true
    break
  fi
  sleep 1
done

if [[ "$API_OK" == true ]]; then
  ok "API respondendo em http://localhost:${API_PORT}/api/health"
else
  warn "API ainda não respondeu no health check (pode estar iniciando). Verifique com: pm2 logs devileye-api"
fi

# =============================================================================
# RESUMO FINAL
# =============================================================================
echo ""
echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${GREEN}║        DevilEye instalado com sucesso!               ║${RESET}"
echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════════════════╝${RESET}"
echo ""
echo -e "  ${BOLD}API (health):${RESET}  http://localhost:${API_PORT}/api/health"
echo -e "  ${BOLD}Frontend:${RESET}      https://${DOMAIN}/devileye/"
echo -e "  ${BOLD}Nginx config:${RESET}  ${INSTALL_DIR}/nginx-devileye.conf"
echo -e "  ${BOLD}PM2 status:${RESET}    pm2 status"
echo -e "  ${BOLD}PM2 logs:${RESET}      pm2 logs devileye-api"
echo ""
echo -e "  ${BOLD}${CYAN}Próximos passos:${RESET}"
echo -e "  1. Inclua o bloco em ${INSTALL_DIR}/nginx-devileye.conf"
echo -e "     dentro do seu server{} no Nginx"
echo -e "  2. Execute: ${DIM}sudo nginx -t && sudo systemctl reload nginx${RESET}"
echo -e "  3. Acesse: ${BOLD}https://${DOMAIN}/devileye/${RESET}"
echo ""
echo -e "  ${BOLD}Usuários padrão:${RESET}"
echo -e "  ${DIM}carvalho / devileye123${RESET}"
echo -e "  ${DIM}ana      / devileye123${RESET}"
echo ""
echo -e "  ${YELLOW}⚠  Troque as senhas padrão em produção!${RESET}"
echo ""
