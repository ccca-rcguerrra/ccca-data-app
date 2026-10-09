#!/bin/bash
#
# Deploy ccca-data-app to the production host with Docker over SSH.
#
# Usage:
#   ./deploy.sh [-s <service>] [-c <deploy|up>]
#
# Examples:
#   ./deploy.sh
#   ./deploy.sh -s ccca-data-app-backend
#   ./deploy.sh -c up

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE=""
CMD="deploy"
COMPOSE_FILE="$SCRIPT_DIR/production/docker-compose.app.yml"
ENV_FILE="$SCRIPT_DIR/production/docker-compose.app.env"
CADDYFILE_HOST="/home/ubuntu/apps/caddy/Caddyfile"

log() { echo ">> $*"; }
die() { echo "[ERROR] $*" >&2; exit 1; }

read_env() {
  local key="$1"
  local value
  value="$(grep -E "^${key}=" "$ENV_FILE" | head -n 1 | cut -d= -f2- || true)"
  value="${value%\'}"
  value="${value#\'}"
  value="${value%\"}"
  value="${value#\"}"
  printf '%s' "$value"
}

while [ $# -gt 0 ]; do
  case $1 in
    -s) SERVICE="${2:-}"; shift 2 ;;
    -c) CMD="${2:-}"; shift 2 ;;
    -*) die "Unknown option: $1" ;;
    *) shift ;;
  esac
done

[ -f "$COMPOSE_FILE" ] || die "Compose file not found: $COMPOSE_FILE"
[ -f "$ENV_FILE" ] || die "Env file not found: $ENV_FILE"

CCCA_DATA_HOST_IP="$(read_env CCCA_DATA_HOST_IP)"
CCCA_DATA_HOST_SSH_USER="$(read_env CCCA_DATA_HOST_SSH_USER)"
PROJECT_NAME="$(read_env PROJECT_NAME)"

[ -n "$CCCA_DATA_HOST_IP" ] || die "CCCA_DATA_HOST_IP is missing in $ENV_FILE"
[ -n "$CCCA_DATA_HOST_SSH_USER" ] || die "CCCA_DATA_HOST_SSH_USER is missing in $ENV_FILE"
[ -n "$PROJECT_NAME" ] || die "PROJECT_NAME is missing in $ENV_FILE"

DOCKER_HOST_URI="ssh://${CCCA_DATA_HOST_SSH_USER}@${CCCA_DATA_HOST_IP}"

remote_compose() {
  DOCKER_API_VERSION=1.40 docker --host "$DOCKER_HOST_URI" \
    compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" -p "$PROJECT_NAME" "$@"
}

ensure_caddy_site() {
  log "Ensuring Caddy site aoitimber.cccabrasil.org"
  ssh -o BatchMode=yes "${CCCA_DATA_HOST_SSH_USER}@${CCCA_DATA_HOST_IP}" "python3 - <<'PY'
from pathlib import Path
path = Path('$CADDYFILE_HOST')
text = path.read_text()
if 'aoitimber.cccabrasil.org' not in text:
    text = text.rstrip() + '''

aoitimber.cccabrasil.org {
	encode gzip

	request_body {
		max_size 20MB
	}

	handle /api/* {
		reverse_proxy ccca-data-app-backend:3000
	}

	handle /socket.io/* {
		reverse_proxy ccca-data-app-backend:3000
	}

	handle {
		reverse_proxy ccca-data-app-frontend:80
	}
}
'''
    path.write_text(text + '\n')
    print('caddyfile_updated')
else:
    print('caddyfile_unchanged')
PY
docker exec caddy caddy reload --config /etc/caddy/Caddyfile"
}

log "Remote host : $DOCKER_HOST_URI"
log "Compose     : $COMPOSE_FILE"
log "Project     : $PROJECT_NAME"
log "Service     : ${SERVICE:-all}"
log "Command     : $CMD"

case "$CMD" in
  deploy)
    if [ -n "$SERVICE" ]; then
      log "Building $SERVICE"
      remote_compose build "$SERVICE"
      log "Recreating $SERVICE"
      remote_compose up -d --force-recreate "$SERVICE"
    else
      log "Building app images"
      remote_compose build
      log "Recreating app containers"
      remote_compose up -d --force-recreate
    fi
    ;;
  up)
    if [ -n "$SERVICE" ]; then
      remote_compose up -d --force-recreate "$SERVICE"
    else
      remote_compose up -d --force-recreate
    fi
    ;;
  *) die "Unknown command: $CMD" ;;
esac

ensure_caddy_site
log "Done."
