#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== Envirotech PowerPoint Generator — Dev Environment ==="
echo ""

# Check Docker is running
if ! docker info &>/dev/null; then
  echo "Error: Docker is not running. Please start Docker Desktop and try again."
  exit 1
fi

# Check .env files exist
if [ ! -f "$ROOT_DIR/backend/.env" ]; then
  echo "Warning: backend/.env not found. Run ./scripts/setup.sh first."
  exit 1
fi

if [ ! -f "$ROOT_DIR/frontend/.env.local" ]; then
  echo "Warning: frontend/.env.local not found. Run ./scripts/setup.sh first."
  exit 1
fi

echo "Starting services..."
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:8000"
echo "  Swagger:   http://localhost:8000/docs"
echo ""

cd "$ROOT_DIR" && docker-compose up --build
