#!/bin/bash
clear
echo "Tazama Demo Application Docker Tag and Release"
echo
echo
echo "Versioning Application and Docker Compose Files..."
echo
cd ./scripts/
node updateTags.mjs
echo
echo
echo "Versioning Application and Docker Compose Files Completed Successfully"
echo
echo
cd ..
echo "Build Docker Image with updated Tag..."
echo
echo
COMPOSE_DOCKER_CLI_BUILD=1 DOCKER_BUILDKIT=1 docker compose -f docker-compose.dev.yml build
echo
echo
echo "Build Docker Image with updated Tag Completed Successfully"
echo
echo
cd ./scripts/
echo "Push Docker Image with updated Tag to DockerHub..."
node pushDockerImage.mjs
echo
echo
echo "Push Docker Image with updated Tag to DockerHub Completed Successfully"
echo