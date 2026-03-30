#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== Envirotech PowerPoint Generator — Setup ==="
echo ""

# 1. Copy .env files from examples if they don't exist
if [ ! -f "$ROOT_DIR/backend/.env" ]; then
  cp "$ROOT_DIR/backend/.env.example" "$ROOT_DIR/backend/.env"
  echo "✓ Created backend/.env from .env.example"
else
  echo "· backend/.env already exists, skipping"
fi

if [ ! -f "$ROOT_DIR/frontend/.env.local" ]; then
  cp "$ROOT_DIR/frontend/.env.local.example" "$ROOT_DIR/frontend/.env.local"
  echo "✓ Created frontend/.env.local from .env.local.example"
else
  echo "· frontend/.env.local already exists, skipping"
fi

echo ""

# 2. Install frontend dependencies
echo "Installing frontend dependencies..."
cd "$ROOT_DIR/frontend" && npm install
echo "✓ Frontend dependencies installed"
echo ""

# 3. Install pptx-engine dependencies
echo "Installing pptx-engine dependencies..."
cd "$ROOT_DIR/pptx-engine" && npm install
echo "✓ pptx-engine dependencies installed"
echo ""

# 4. Set up backend Python venv
echo "Setting up backend Python environment..."
cd "$ROOT_DIR/backend"
if [ ! -d .venv ]; then
  python3 -m venv .venv
fi
source .venv/bin/activate
pip install -r requirements.txt
deactivate
echo "✓ Backend dependencies installed"
echo ""

echo "=== Setup complete! ==="
echo ""
echo "Next steps:"
echo "  1. Edit backend/.env and frontend/.env.local with your Supabase credentials"
echo "  2. Run ./scripts/dev.sh to start the development environment"
