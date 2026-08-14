#!/bin/bash
#
# Script de deploy para frontend React/Vite com Docker.
# Uso:
#   ./deploy.sh -s <service> [-c <deploy|up>] [-e <production|staging>]
#
# Parâmetros:
#   -s <service>   Serviço a ser construído (obrigatório). Ex: sensedata-frontend
#   -c <command>   Comando a executar: deploy (default) ou up.
#   -e <env>       Ambiente (default: production).
#
# Exemplo:
#   ./deploy.sh -s sensedata-frontend -c deploy -e production
#
# Funcionalidades:
#   - Build do frontend React/Vite
#   - Construção da imagem Docker com Nginx
#   - Push para GitLab Container Registry
#   - Deploy no servidor remoto via SSH
#
# Autor: Rafael Guerra
# Data: 2025-01-27

# Variáveis principais
BUILD_VERSION=latest
ENV=production
CMD="deploy"


# Função para exibir logs com prefixo
log() {
  echo ">> $*"
}

# Função para erro e saída
die() {
  echo "[ERRO] $*"
  exit 1
}

# Parse de argumentos
while [ $# -gt 0 ]; do
  case $1 in
  -c)
    CMD="$2"
    shift 2
    ;;
  -s)
    SERVICE="$2"
    shift 2
    ;;
  -e)
    ENV="$2"
    shift 2
    ;;
  -*)
    die "Opção desconhecida: $1"
    ;;
  *)
    shift
    ;;
  esac
done

ENV_FILE="./docker-compose.$ENV.env"
DEPLOY_DOCKER_FILE="./docker-compose.$ENV.yml"

# Verifica se SERVICE foi passado
if [ -z "$SERVICE" ]; then
  die "Serviço não especificado. Use -s <service>"
fi

# Carregar variáveis de ambiente do arquivo .env, se existir
if [ -f "$ENV_FILE" ]; then
  log "Carregando variáveis de ambiente de $ENV_FILE"
  echo "+ source \"$ENV_FILE\""
  set -o allexport
  source "$ENV_FILE"
  set +o allexport
fi

DEPLOY_DOCKER_HOST="ssh://$DEPLOY_HOST_USER@$DEPLOY_HOST"

# Determina o nome real da imagem no docker-compose.yml
log "Buscando nome da imagem no docker-compose para o serviço: $SERVICE"
echo "+ docker compose -f \"$DEPLOY_DOCKER_FILE\" config"
SERVICE_IMAGE_NAME=$(docker compose -f "$DEPLOY_DOCKER_FILE" config | awk "/$SERVICE:/ {flag=1} flag && /image:/ {print \$2; exit}")
echo "+ SERVICE_IMAGE_NAME=$SERVICE_IMAGE_NAME"

# Função de build e push da imagem usando docker compose
build_and_push() {
  log "Preparando build e push da imagem do serviço: $SERVICE"
  
  # Verificar se pnpm está disponível
  if ! command -v pnpm &> /dev/null; then
    log "Instalando pnpm..."
    npm install -g pnpm
  fi
  
  # Instalar dependências e fazer build do frontend LOCALMENTE
  log "Instalando dependências e fazendo build do frontend localmente..."
  cd ..
  pnpm install --frozen-lockfile
  pnpm run build
  
  # Verificar se o build foi bem-sucedido
  if [ ! -d "dist" ]; then
    die "Build falhou - pasta dist não encontrada"
  fi
  
  log "Build local concluído com sucesso"
  cd docker
    
  # Build da imagem Docker (apenas nginx)
  log "Construindo imagem Docker com nginx..."
  echo "+ docker compose -f $DEPLOY_DOCKER_FILE build $SERVICE"
  docker compose -f $DEPLOY_DOCKER_FILE build $SERVICE

  if [ -z "$SERVICE_IMAGE_NAME" ]; then
    die "Não foi possível determinar o nome da imagem para o serviço $SERVICE"
  fi

  log "Imagem gerada localmente: $SERVICE_IMAGE_NAME"

  # Tag e push da imagem
  log "Fazendo tag e push da imagem para o registry..."
  echo "+ docker tag \"$SERVICE_IMAGE_NAME\" \"$DEPLOY_DOCKER_REGISTRY\""
  docker tag "$SERVICE_IMAGE_NAME" "$DEPLOY_DOCKER_REGISTRY"

  echo "+ docker push \"$DEPLOY_DOCKER_REGISTRY\""
  docker push "$DEPLOY_DOCKER_REGISTRY"
}

# Função para recriar o container no host remoto
recreate_remote_container() {
  log "Recriando container no host remoto usando SSH..."

  echo "+ docker --host \"$DEPLOY_DOCKER_HOST\" pull \"$DEPLOY_DOCKER_REGISTRY\""
  DOCKER_API_VERSION=1.40 docker --host "$DEPLOY_DOCKER_HOST" pull "$DEPLOY_DOCKER_REGISTRY"

  echo "+ docker --host \"$DEPLOY_DOCKER_HOST\" tag \"$DEPLOY_DOCKER_REGISTRY\" \"$SERVICE_IMAGE_NAME\""
  DOCKER_API_VERSION=1.40 docker --host "$DEPLOY_DOCKER_HOST" tag "$DEPLOY_DOCKER_REGISTRY" "$SERVICE_IMAGE_NAME"

  echo "+ docker --host \"$DEPLOY_DOCKER_HOST\" compose -f ./docker-compose.$ENV.yml -p \"$DEPLOY_DOCKER_STACK\" up -d --force-recreate $SERVICE"
  DOCKER_API_VERSION=1.40 docker --host "$DEPLOY_DOCKER_HOST" compose -f ./docker-compose.$ENV.yml -p "$DEPLOY_DOCKER_STACK" up -d --force-recreate $SERVICE

  log "Limpando imagens antigas no host remoto..."
  echo "+ docker --host \"$DEPLOY_DOCKER_HOST\" image prune -a -f"
  DOCKER_API_VERSION=1.40 docker --host "$DEPLOY_DOCKER_HOST" image prune -a -f
}

up() {
  log "Executando docker compose up diretamente no host remoto via SSH"
  echo "+ docker --host \"$DEPLOY_DOCKER_HOST\" compose -f ./docker-compose.$ENV.yml -p \"$DEPLOY_DOCKER_STACK\" up -d --force-recreate \"$SERVICE\""
  DOCKER_API_VERSION=1.40 docker --host "$DEPLOY_DOCKER_HOST" compose -f ./docker-compose.$ENV.yml -p "$DEPLOY_DOCKER_STACK" up -d --force-recreate "$SERVICE"
}

# Execução principal
case "$CMD" in
deploy)
  build_and_push
  recreate_remote_container
  ;;
up)
  up
  ;;
*)
  die "Comando não reconhecido: $CMD"
  ;;
esac
