#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MIGRATION_FILE="$ROOT_DIR/supabase/migrations/001_initial_schema.sql"
SEED_FILE="$ROOT_DIR/backend/seed.sql"

echo "=== Envirotech PowerPoint Generator — Database Setup ==="
echo ""

# Try to read DATABASE_URL from backend/.env
DB_URL=""
if [ -f "$ROOT_DIR/backend/.env" ]; then
  DB_URL=$(grep -E "^SUPABASE_DB_URL=" "$ROOT_DIR/backend/.env" | cut -d '=' -f2- || true)
fi

if [ -n "$DB_URL" ] && command -v psql &>/dev/null; then
  echo "Running migration..."
  psql "$DB_URL" -f "$MIGRATION_FILE"
  echo "✓ Schema created"
  echo ""

  if [ -f "$SEED_FILE" ]; then
    echo "Seeding data..."
    psql "$DB_URL" -f "$SEED_FILE"
    echo "✓ Seed data loaded (consultants + products)"
  fi

  echo ""
  echo "=== Database setup complete ==="
else
  echo "To set up the database automatically, install psql and set SUPABASE_DB_URL"
  echo "in backend/.env. Then re-run this script."
  echo ""
  echo "Alternatively, run these SQL files manually in the Supabase SQL Editor:"
  echo "  1. supabase/migrations/001_initial_schema.sql  (schema)"
  echo "  2. backend/seed.sql                            (test data)"
  echo ""
  echo "See docs/SUPABASE_SETUP.md for detailed instructions."
fi
