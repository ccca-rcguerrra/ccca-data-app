# Docker Deploy - Sense Data Frontend

Este diretório contém os arquivos necessários para o deploy do frontend React/Vite usando Docker.

## Arquivos

- `Dockerfile` - Imagem nginx para servir arquivos estáticos (build externo)
- `nginx.conf` - Configuração do Nginx para servir a aplicação React
- `docker-compose.production.yml` - Orquestração dos serviços em produção
- `docker-compose.production.env` - Variáveis de ambiente para produção
- `deploy.sh` - Script automatizado de deploy (build local + Docker)

## Como usar

### Deploy completo (build + push + deploy remoto)
```bash
./deploy.sh -s sensedata-frontend -c deploy -e production
```

### Apenas restart do serviço remoto
```bash
./deploy.sh -s sensedata-frontend -c up -e production
```

### Build local para teste
```bash
# Build manual
pnpm install
pnpm run build

# Build da imagem Docker (apenas nginx)
docker compose -f docker-compose.production.yml build sensedata-frontend

# Executar localmente
docker compose -f docker-compose.production.yml up sensedata-frontend
```

## Estrutura do Deploy

1. **Build Local**: Instala dependências e constrói o frontend com Vite localmente
2. **Docker Stage**: Usa apenas Nginx Alpine para servir os arquivos estáticos buildados
3. **Deploy**: Push para GitLab Container Registry e deploy no servidor remoto

## Vantagens da Nova Estrutura

- **Build mais rápido**: Não precisa instalar Node.js no Docker
- **Imagem menor**: Apenas nginx, sem dependências de build
- **Build local**: Melhor para debugging e desenvolvimento
- **Reutilização**: Pode usar o mesmo build para diferentes ambientes

## Variáveis de Ambiente

As variáveis de ambiente são carregadas do arquivo `docker-compose.production.env` e devem ter o prefixo `VITE_` para serem acessíveis no frontend.

## Serviços

- **sensedata-frontend**: Aplicação React servida pelo Nginx (porta 8083)
- **sensedata-redis**: Cache Redis (porta 6380)

## Requisitos

- Docker e Docker Compose
- pnpm (instalado globalmente)
- Acesso SSH ao servidor de produção
- Acesso ao GitLab Container Registry
