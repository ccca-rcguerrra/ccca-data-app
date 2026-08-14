#!/bin/bash
#
# Sobe um serviço no host remoto via Docker-over-SSH.
# Execute a partir do diretório deploy/.
#
# Usage:
#   ./deploy.sh -s <service> [-e <staging|production>] [-f <compose.yml>]
#
# Default compose file when -f is omitted: ./docker-compose.<env>.yml
#
# Examples:
#   ./deploy.sh -s mapbiomas-alertas-workspace-backend
#   ./deploy.sh -s mapbiomas-alertas-workspace-backend -e production
#   ./deploy.sh -s mapbiomas-alertas-workspace-backend -f ./docker-compose.dev.yml
ENV="staging"
COMPOSE_FILE_OVERRIDE=""

log() { echo ">> $*"; }
die() { echo "[ERRO] $*" >&2; exit 1; }

while [ $# -gt 0 ]; do
  case $1 in
    -s) SERVICE="$2"; shift 2 ;;
    -e) ENV="$2";     shift 2 ;;
    -f)
      [ -z "${2:-}" ] && die "Option -f requires a compose file path"
      COMPOSE_FILE_OVERRIDE="$2"
      shift 2
      ;;
    -*) die "Opção desconhecida: $1" ;;
    *)  shift ;;
  esac
done

[ -z "$SERVICE" ] && die "Serviço não informado. Use -s <service>"

ENV_FILE="./docker-compose.$ENV.env"
if [ -n "$COMPOSE_FILE_OVERRIDE" ]; then
  COMPOSE_FILE="$COMPOSE_FILE_OVERRIDE"
else
  COMPOSE_FILE="./docker-compose.$ENV.yml"
fi

[ -f "$COMPOSE_FILE" ] || die "Arquivo não encontrado: $COMPOSE_FILE"

if [ -f "$ENV_FILE" ]; then
  log "Carregando variáveis de $ENV_FILE"
  set -o allexport
  source "$ENV_FILE"
  set +o allexport
fi

[ -z "$MB_ALERTA_WS_HOST_IP" ]       && die "MB_ALERTA_WS_HOST_IP não definido em $ENV_FILE"
[ -z "$MB_ALERTA_WS_HOST_SSH_USER" ] && die "MB_ALERTA_WS_HOST_SSH_USER não definido em $ENV_FILE"
[ -z "$PROJECT_NAME" ]               && die "PROJECT_NAME não definido em $ENV_FILE"

DOCKER_HOST_URI="ssh://$MB_ALERTA_WS_HOST_SSH_USER@$MB_ALERTA_WS_HOST_IP"

log "Host remoto : $DOCKER_HOST_URI"
log "Compose     : $COMPOSE_FILE"
log "Projeto     : $PROJECT_NAME"
log "Serviço     : $SERVICE"

DOCKER_API_VERSION=1.40 docker --host "$DOCKER_HOST_URI" \
  compose -f "$COMPOSE_FILE" -p "$PROJECT_NAME" \
  up -d --force-recreate "$SERVICE" \
  || die "docker compose up falhou"

log "Concluído."
