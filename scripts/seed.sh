#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MIGRATION_FILE="$ROOT_DIR/supabase/migrations/001_initial_schema.sql"

echo "=== Envirotech PowerPoint Generator — Seed Database ==="
echo ""

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "Error: Migration file not found at $MIGRATION_FILE"
  exit 1
fi

# Try to read DATABASE_URL from backend/.env
if [ -f "$ROOT_DIR/backend/.env" ]; then
  DB_URL=$(grep -E "^SUPABASE_DB_URL=" "$ROOT_DIR/backend/.env" | cut -d '=' -f2-)
fi

if [ -n "${DB_URL:-}" ] && command -v psql &>/dev/null; then
  echo "Running migration against database..."
  psql "$DB_URL" -f "$MIGRATION_FILE"
  echo ""
  echo "✓ Migration applied successfully"
else
  echo "To apply the database schema, run the following SQL in your Supabase dashboard"
  echo "(SQL Editor → New Query):"
  echo ""
  echo "--- File: supabase/migrations/001_initial_schema.sql ---"
  cat "$MIGRATION_FILE"
  echo ""
  echo "---"
  echo ""
  echo "Tip: Install psql and set SUPABASE_DB_URL in backend/.env to run this automatically."
fi
