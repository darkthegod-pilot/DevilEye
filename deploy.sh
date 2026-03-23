#!/usr/bin/env bash
# =============================================================================
#  DevilEye — Deploy Script para Hostinger VPS KVM 4
#  Faz build do frontend, envia tudo via rsync e reinicia a API via PM2
# =============================================================================
set -euo pipefail

# ---------------------------------------------------------------------------
# CORES E SÍMBOLOS
# ---------------------------------------------------------------------------
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; DIM='\033[2m'; RESET='\033[0m'
CHECK="${GREEN}✓${RESET}"; CROSS="${RED}✗${RESET}"; ARROW="${CYAN}→${RESET}"
SPINNER=('⠋' '⠙' '⠹' '⠸' '⠼' '⠴' '⠦' '⠧' '⠇' '⠏')

CONFIG_FILE=".deploy.conf"
LOG_FILE="deploy.log"
START_TIME=$(date +%s)
TOTAL_STEPS=8

# ---------------------------------------------------------------------------
# HELPERS
# ---------------------------------------------------------------------------
step() { echo -e "\n${BOLD}[$1/$TOTAL_STEPS]${RESET} $2"; }
ok()   { echo -e "  ${CHECK} $1"; }
warn() { echo -e "  ${YELLOW}⚠ $1${RESET}"; }
err()  { echo -e "  ${CROSS} ${RED}$1${RESET}"; }
info() { echo -e "  ${DIM}ℹ $1${RESET}"; }
die()  { err "$1"; echo -e "\n${RED}${BOLD}Deploy abortado.${RESET}"; exit 1; }

elapsed() {
  local s=$(( $(date +%s) - START_TIME ))
  printf "%dm%02ds" $((s/60)) $((s%60))
}

spinner_start() {
  local msg="$1"
  local i=0
  while true; do
    printf "\r  ${CYAN}${SPINNER[$i]}${RESET} ${msg}   "
    i=$(( (i+1) % ${#SPINNER[@]} ))
    sleep 0.1
  done &
  SPINNER_PID=$!
}

spinner_stop() {
  if [[ -n "${SPINNER_PID:-}" ]]; then
    kill "$SPINNER_PID" 2>/dev/null || true
    wait "$SPINNER_PID" 2>/dev/null || true
    SPINNER_PID=""
    printf "\r"
  fi
}

run_cmd() {
  local msg="$1"; shift
  spinner_start "$msg"
  if "$@" >>"$LOG_FILE" 2>&1; then
    spinner_stop
    ok "$msg"
  else
    spinner_stop
    err "$msg — falhou (veja $LOG_FILE)"
    return 1
  fi
}

ssh_run() {
  ssh -p "$SSH_PORT" -o ConnectTimeout=15 -o StrictHostKeyChecking=accept-new \
    "${SSH_USER}@${SSH_HOST}" "$@"
}

# ---------------------------------------------------------------------------
# FLAGS
# ---------------------------------------------------------------------------
BUILD_ONLY=false
UPLOAD_ONLY=false
DRY_RUN=false
RECONFIGURE=false

for arg in "$@"; do
  case $arg in
    --build-only)    BUILD_ONLY=true ;;
    --upload-only)   UPLOAD_ONLY=true ;;
    --dry-run)       DRY_RUN=true ;;
    --reconfigure)   RECONFIGURE=true ;;
    --help|-h)
      echo -e "${BOLD}DevilEye Deploy${RESET} — Hostinger VPS KVM 4"
      echo ""
      echo "Uso: $0 [opções]"
      echo ""
      echo "Opções:"
      echo "  --build-only    Apenas faz o build, sem fazer upload"
      echo "  --upload-only   Apenas faz upload (sem rebuild)"
      echo "  --dry-run       Simula o deploy sem enviar arquivos"
      echo "  --reconfigure   Forçar novo wizard de configuração"
      echo "  --help          Exibe esta ajuda"
      echo ""
      echo "Arquivo de configuração salvo em: $CONFIG_FILE"
      exit 0 ;;
  esac
done

# ---------------------------------------------------------------------------
# BANNER
# ---------------------------------------------------------------------------
echo ""
echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${CYAN}║  🔍 DevilEye — Deploy para Hostinger VPS KVM 4  ║${RESET}"
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════╝${RESET}"
echo ""
[[ "$DRY_RUN" == true ]] && echo -e "  ${YELLOW}${BOLD}MODO DRY-RUN — nenhum arquivo será enviado${RESET}\n"

: > "$LOG_FILE"
echo "=== Deploy iniciado em $(date) ===" >> "$LOG_FILE"

# ---------------------------------------------------------------------------
# ETAPA 1 — PRÉ-REQUISITOS
# ---------------------------------------------------------------------------
step 1 "Verificando pré-requisitos..."

check_cmd() {
  if command -v "$1" &>/dev/null; then
    ok "$1 $(${2:-$1 --version 2>/dev/null | head -1} 2>/dev/null || true)"
  else
    err "$1 não encontrado"
    echo -e "    ${DIM}Instale com: ${3:-apt-get install $1}${RESET}"
    return 1
  fi
}

PREREQ_OK=true
check_cmd node  "" "curl -fsSL https://deb.nodesource.com/setup_lts.x | bash - && apt-get install -y nodejs"  || PREREQ_OK=false
check_cmd npm   "" || PREREQ_OK=false
check_cmd rsync "" "apt-get install rsync" || PREREQ_OK=false
check_cmd ssh   "" "apt-get install openssh-client" || PREREQ_OK=false
check_cmd curl  "" "apt-get install curl" || PREREQ_OK=false

[[ "$PREREQ_OK" == false ]] && die "Instale as ferramentas faltantes e tente novamente."

# ---------------------------------------------------------------------------
# ETAPA 2 — CONFIGURAÇÃO
# ---------------------------------------------------------------------------
step 2 "Configuração de deploy..."

load_config() {
  if [[ -f "$CONFIG_FILE" ]]; then
    source "$CONFIG_FILE"
    return 0
  fi
  return 1
}

ask() {
  local var="$1" prompt="$2" default="${3:-}"
  local current="${!var:-$default}"
  if [[ -n "$current" ]]; then
    printf "  %s [%s]: " "$prompt" "$current"
  else
    printf "  %s: " "$prompt"
  fi
  read -r input
  if [[ -n "$input" ]]; then
    printf -v "$var" '%s' "$input"
  elif [[ -n "$current" ]]; then
    printf -v "$var" '%s' "$current"
  fi
}

if [[ "$RECONFIGURE" == false ]] && load_config; then
  info "Configuração salva encontrada ($CONFIG_FILE)"
  echo -e "    ${DIM}SSH: ${SSH_USER}@${SSH_HOST}:${SSH_PORT}${RESET}"
  echo -e "    ${DIM}Remoto: ${REMOTE_BASE}${RESET}"
  echo -e "    ${DIM}Subdir: ${DEPLOY_SUBDIR}${RESET}"
  echo -e "    ${DIM}URL: ${SITE_URL}${RESET}"
  printf "\n  Usar estas configurações? [S/n]: "
  read -r resp
  if [[ "$resp" =~ ^[Nn]$ ]]; then
    RECONFIGURE=true
  fi
fi

if [[ "$RECONFIGURE" == true ]] || ! load_config 2>/dev/null; then
  echo ""
  echo -e "  ${BOLD}Configuração do servidor SSH:${RESET}"
  SSH_HOST="${SSH_HOST:-}"
  SSH_USER="${SSH_USER:-root}"
  SSH_PORT="${SSH_PORT:-22}"
  REMOTE_BASE="${REMOTE_BASE:-/var/www/devileye}"
  DEPLOY_SUBDIR="${DEPLOY_SUBDIR:-/devileye}"
  SITE_URL="${SITE_URL:-}"

  ask SSH_HOST   "Host SSH (IP ou domínio)"
  ask SSH_USER   "Usuário SSH" "root"
  ask SSH_PORT   "Porta SSH" "22"
  ask REMOTE_BASE "Diretório base no servidor" "/var/www/devileye"
  ask DEPLOY_SUBDIR "Subdiretório da URL (ex: /devileye)" "/devileye"
  ask SITE_URL   "URL do site (https://seudominio.com)"

  [[ -z "${SSH_HOST:-}" ]] && die "Host SSH não pode ser vazio."
  [[ -z "${SITE_URL:-}" ]] && die "URL do site não pode ser vazia."

  cat > "$CONFIG_FILE" <<EOF
SSH_HOST="$SSH_HOST"
SSH_USER="$SSH_USER"
SSH_PORT="$SSH_PORT"
REMOTE_BASE="$REMOTE_BASE"
DEPLOY_SUBDIR="$DEPLOY_SUBDIR"
SITE_URL="$SITE_URL"
EOF
  ok "Configuração salva em $CONFIG_FILE"
fi

# Senha SSH (nunca salva)
printf "\n  Senha SSH (deixe em branco se usa chave SSH): "
read -rs SSH_PASS
echo ""
if [[ -n "$SSH_PASS" ]]; then
  if ! command -v sshpass &>/dev/null; then
    warn "sshpass não encontrado — será ignorado (use chave SSH)"
    SSH_PASS=""
  fi
fi

SSH_CMD="ssh -p $SSH_PORT -o ConnectTimeout=15 -o StrictHostKeyChecking=accept-new"
RSYNC_SSH="ssh -p $SSH_PORT -o ConnectTimeout=15 -o StrictHostKeyChecking=accept-new"
if [[ -n "$SSH_PASS" ]]; then
  SSH_CMD="sshpass -p $SSH_PASS ssh -p $SSH_PORT -o ConnectTimeout=15 -o StrictHostKeyChecking=accept-new"
  RSYNC_SSH="sshpass -p $SSH_PASS ssh -p $SSH_PORT -o ConnectTimeout=15 -o StrictHostKeyChecking=accept-new"
fi

ok "Configuração pronta — ${SSH_USER}@${SSH_HOST}:${SSH_PORT}"

# ---------------------------------------------------------------------------
# ETAPA 3 — BUILD FRONTEND
# ---------------------------------------------------------------------------
if [[ "$UPLOAD_ONLY" == false ]]; then
  step 3 "Build do frontend..."

  if [[ ! -d "node_modules" ]]; then
    run_cmd "Instalando dependências (npm install)..." npm install || die "npm install falhou"
  fi

  VITE_BASE_URL="${DEPLOY_SUBDIR}/"
  export VITE_BASE_URL

  run_cmd "Compilando com Vite (VITE_BASE_URL=${VITE_BASE_URL})..." npm run build \
    || die "Build falhou — veja $LOG_FILE para detalhes\n$(tail -20 $LOG_FILE)"

  # Tamanho do dist
  DIST_SIZE=$(du -sh dist/ 2>/dev/null | cut -f1 || echo "?")
  ok "Build concluído — dist/ (~${DIST_SIZE})"
else
  step 3 "Build pulado (--upload-only)"
  [[ ! -d "dist" ]] && die "dist/ não existe — execute sem --upload-only primeiro"
  ok "Usando dist/ existente"
fi

# ---------------------------------------------------------------------------
# ETAPA 4 — GERAR nginx-devileye.conf (apenas na primeira run)
# ---------------------------------------------------------------------------
step 4 "Gerando configuração Nginx..."

NGINX_CONF="nginx-devileye.conf"
if [[ ! -f "$NGINX_CONF" ]]; then
  cat > "$NGINX_CONF" <<NGINX_EOF
# DevilEye — Nginx config
# Copie para /etc/nginx/sites-available/devileye e faça symlink em sites-enabled/
# Ajuste server_name e caminhos conforme necessário.

server {
    listen 80;
    server_name seudominio.com www.seudominio.com;

    # Redirecionar HTTP → HTTPS (descomente após configurar SSL)
    # return 301 https://\$host\$request_uri;

    # Frontend (SPA)
    location ${DEPLOY_SUBDIR}/ {
        alias ${REMOTE_BASE}/public/;
        try_files \$uri \$uri/ ${DEPLOY_SUBDIR}/index.html;

        # Cache agressivo para assets com hash
        location ~* \.(js|css|woff2?|png|jpg|svg|ico)\$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
        # Sem cache para index.html
        location ~* index\.html\$ {
            add_header Cache-Control "no-cache, no-store, must-revalidate";
        }
    }

    # Backend API
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
        client_max_body_size 55M;
    }

    # Uploads/anexos
    location /uploads/ {
        alias ${REMOTE_BASE}/backend/uploads/;
        expires 7d;
        add_header Cache-Control "public";
    }
}

# HTTPS (descomente após: certbot --nginx -d seudominio.com)
# server {
#     listen 443 ssl;
#     server_name seudominio.com;
#     ssl_certificate /etc/letsencrypt/live/seudominio.com/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/seudominio.com/privkey.pem;
#     ... (copie location blocks acima)
# }
NGINX_EOF
  ok "nginx-devileye.conf gerado"
  info "Copie para o servidor e configure Nginx (instruções no arquivo)"
else
  ok "nginx-devileye.conf já existe (mantido)"
fi

# ---------------------------------------------------------------------------
# ETAPA 5 — UPLOAD FRONTEND (rsync dist/ → servidor)
# ---------------------------------------------------------------------------
step 5 "Enviando frontend para o servidor..."

REMOTE_PUBLIC="${REMOTE_BASE}/public"
RSYNC_FLAGS="-avz --delete --exclude='.DS_Store' --exclude='*.map'"

if [[ "$DRY_RUN" == true ]]; then
  ok "DRY-RUN: rsync dist/ → ${SSH_USER}@${SSH_HOST}:${REMOTE_PUBLIC}/"
else
  # Criar diretório remoto se não existir
  $SSH_CMD "${SSH_USER}@${SSH_HOST}" "mkdir -p ${REMOTE_PUBLIC} ${REMOTE_BASE}/backend/uploads" \
    >> "$LOG_FILE" 2>&1 || warn "Não foi possível criar diretórios remotos (pode já existir)"

  spinner_start "Enviando dist/ via rsync..."
  RSYNC_OK=false
  for attempt in 1 2 3; do
    if rsync $RSYNC_FLAGS \
        -e "$RSYNC_SSH" \
        dist/ "${SSH_USER}@${SSH_HOST}:${REMOTE_PUBLIC}/" \
        >> "$LOG_FILE" 2>&1; then
      RSYNC_OK=true
      break
    fi
    [[ $attempt -lt 3 ]] && sleep $((attempt * 2))
  done
  spinner_stop

  if [[ "$RSYNC_OK" == true ]]; then
    ok "Frontend enviado para ${REMOTE_PUBLIC}/"
  else
    err "rsync falhou após 3 tentativas — veja $LOG_FILE"
    die "Verifique conexão SSH e permissões no servidor."
  fi
fi

# ---------------------------------------------------------------------------
# ETAPA 6 — UPLOAD BACKEND (rsync backend/ → servidor)
# ---------------------------------------------------------------------------
step 6 "Enviando backend para o servidor..."

if [[ "$DRY_RUN" == true ]]; then
  ok "DRY-RUN: rsync backend/ → ${SSH_USER}@${SSH_HOST}:${REMOTE_BASE}/backend/"
else
  spinner_start "Enviando backend/ via rsync..."
  RSYNC_OK=false
  for attempt in 1 2 3; do
    if rsync $RSYNC_FLAGS \
        --exclude='node_modules/' \
        --exclude='prisma/*.db' \
        --exclude='prisma/*.db-journal' \
        --exclude='uploads/' \
        --exclude='.env' \
        -e "$RSYNC_SSH" \
        backend/ "${SSH_USER}@${SSH_HOST}:${REMOTE_BASE}/backend/" \
        >> "$LOG_FILE" 2>&1; then
      RSYNC_OK=true
      break
    fi
    [[ $attempt -lt 3 ]] && sleep $((attempt * 2))
  done
  spinner_stop

  if [[ "$RSYNC_OK" == true ]]; then
    ok "Backend enviado para ${REMOTE_BASE}/backend/"
  else
    err "rsync backend falhou após 3 tentativas"
    die "Verifique conexão SSH e permissões no servidor."
  fi

  # Enviar ecosystem.config.js
  rsync -avz -e "$RSYNC_SSH" ecosystem.config.js \
    "${SSH_USER}@${SSH_HOST}:${REMOTE_BASE}/" >> "$LOG_FILE" 2>&1 || true

  # ---------------------------------------------------------------------------
  # ETAPA 6b — Instalar deps + migrate + reiniciar PM2
  # ---------------------------------------------------------------------------
  echo ""
  info "Configurando backend no servidor..."

  REMOTE_CMDS=$(cat <<'REMOTE_EOF'
set -e
cd ${REMOTE_BASE}

# Criar .env se não existir
if [ ! -f backend/.env ]; then
  cat > backend/.env <<ENV_EOF
NODE_ENV=production
PORT=3001
DATABASE_URL=file:${REMOTE_BASE}/backend/prisma/devileye.db
JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "CHANGE_ME_$(date +%s)")
UPLOADS_DIR=${REMOTE_BASE}/backend/uploads
FRONTEND_URL=${SITE_URL}
ENV_EOF
  echo "  [ok] .env criado"
fi

# Instalar dependências
cd backend
npm install --production --silent
echo "  [ok] npm install concluído"

# Migrar banco de dados
npx prisma migrate deploy 2>&1 || npx prisma db push 2>&1
echo "  [ok] Prisma migrate deploy concluído"

cd ${REMOTE_BASE}

# PM2
if ! command -v pm2 &>/dev/null; then
  npm install -g pm2
  echo "  [ok] PM2 instalado"
fi

if pm2 list 2>/dev/null | grep -q "devileye-api"; then
  pm2 restart devileye-api --update-env
  echo "  [ok] PM2 reiniciado"
else
  pm2 start ecosystem.config.js --env production
  pm2 save
  echo "  [ok] PM2 iniciado"
fi
REMOTE_EOF
  )

  REMOTE_CMDS="${REMOTE_CMDS//\$\{REMOTE_BASE\}/${REMOTE_BASE}}"
  REMOTE_CMDS="${REMOTE_CMDS//\$\{SITE_URL\}/${SITE_URL}}"

  spinner_start "Instalando deps + migrando DB + reiniciando PM2..."
  if $SSH_CMD "${SSH_USER}@${SSH_HOST}" "bash -s" <<< "$REMOTE_CMDS" >> "$LOG_FILE" 2>&1; then
    spinner_stop
    ok "Backend configurado e rodando via PM2"
  else
    spinner_stop
    warn "Alguns passos remotos falharam — veja $LOG_FILE"
    info "Execute manualmente no servidor:"
    info "  cd ${REMOTE_BASE}/backend && npm install --production"
    info "  npx prisma migrate deploy"
    info "  cd ${REMOTE_BASE} && pm2 start ecosystem.config.js --env production"
  fi
fi

# ---------------------------------------------------------------------------
# ETAPA 7 — VERIFICAR DEPLOY
# ---------------------------------------------------------------------------
step 7 "Verificando deploy..."

if [[ "$DRY_RUN" == true ]]; then
  ok "DRY-RUN: verificação pulada"
else
  sleep 3  # aguardar PM2 subir
  CHECK_URLS=(
    "${SITE_URL}${DEPLOY_SUBDIR}/"
    "${SITE_URL}/api/health"
  )
  ALL_OK=true
  for url in "${CHECK_URLS[@]}"; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "000")
    if [[ "$HTTP_CODE" == "200" ]]; then
      ok "HTTP $HTTP_CODE — $url"
    elif [[ "$HTTP_CODE" == "000" ]]; then
      warn "Timeout/sem resposta — $url"
      ALL_OK=false
    else
      warn "HTTP $HTTP_CODE — $url"
      ALL_OK=false
    fi
  done

  if [[ "$ALL_OK" == false ]]; then
    echo ""
    warn "Algumas verificações falharam. Possíveis causas:"
    info "• Nginx não configurado — copie nginx-devileye.conf para /etc/nginx/sites-available/"
    info "• PM2 não iniciou — verifique: pm2 logs devileye-api"
    info "• Firewall bloqueando porta 80/443 — verifique UFW/iptables"
    info "• DNS ainda propagando — aguarde alguns minutos"
  fi
fi

# ---------------------------------------------------------------------------
# ETAPA 8 — RESUMO FINAL
# ---------------------------------------------------------------------------
step 8 "Concluído!"

echo ""
echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════════╗${RESET}"
if [[ "$DRY_RUN" == true ]]; then
  echo -e "${BOLD}${GREEN}║  ✓ DRY-RUN concluído — nenhum arquivo enviado   ║${RESET}"
else
  echo -e "${BOLD}${GREEN}║  ✓ Deploy concluído com sucesso!                ║${RESET}"
fi
echo -e "${BOLD}${GREEN}╠══════════════════════════════════════════════════╣${RESET}"
echo -e "${BOLD}${GREEN}║  ${ARROW} ${SITE_URL}${DEPLOY_SUBDIR}/$(printf '%*s' $((28 - ${#SITE_URL} - ${#DEPLOY_SUBDIR})) '')${GREEN}║${RESET}"
echo -e "${BOLD}${GREEN}║  ${DIM}API: ${SITE_URL}/api/health$(printf '%*s' $((32 - ${#SITE_URL})) '')${GREEN}║${RESET}"
echo -e "${BOLD}${GREEN}║  ${DIM}Duração: $(elapsed)$(printf '%*s' $((38 - ${#elapsed})) '')${GREEN}║${RESET}"
echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════════════╝${RESET}"
echo ""
echo -e "  ${DIM}Log completo em: $LOG_FILE${RESET}"

if [[ "$DRY_RUN" == false ]]; then
  echo ""
  echo -e "  ${BOLD}Credenciais iniciais:${RESET}"
  echo -e "  ${DIM}• carvalho / devileye123${RESET}"
  echo -e "  ${DIM}• ana / devileye123${RESET}"
  echo -e "  ${DIM}• melo / devileye123${RESET}"
  echo -e "  ${YELLOW}  ⚠ Altere as senhas após o primeiro acesso!${RESET}"
fi
echo ""
