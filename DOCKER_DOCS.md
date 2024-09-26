# Docker Compose Instructions# Docker Compose Instructions

## Build Instructions

### Docker File

Run this command to build the docker image for DEVELOPMENT

```bash
COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker compose -f docker-compose.dev.yml build
```

### Docker Compose

#### Run Containers

Run containers in dev mode

```bash
docker compose -f docker-compose.dev.yml up -d
```

Run containers in production mode

```bash
docker compose -f docker-compose.production.yml up -d
```

### Run Both Commands at Once

Dev Mode:

```bash
COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker compose -f docker-compose.dev.yml build && docker compose -f docker-compose.dev.yml up -d
```

Production Mode:

```bash
COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker compose -f docker-compose.production.yml build && docker compose -f docker-compose.production.yml up -d
```
