# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Frontend (Next.js 16 + React 19)
```bash
cd frontend
npm install
npm run dev          # starts on 0.0.0.0:3000
npm run build        # production build
npm run lint         # eslint
```

### Backend (FastAPI + Python 3.11+)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload    # starts on :8000
```
Requires `.env` in `backend/` with: `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_DB_URL`. Optional: `PPTX_ENGINE_PATH` (default `../pptx-engine`), `STORAGE_BUCKET` (default `presentations`), `FRONTEND_URL` (default `http://localhost:3000`), `GEMINI_API_KEY` (for AI space parsing).

### PPTX Engine (Node.js CLI)
```bash
cd pptx-engine
npm install
echo '{"outputPath":"test.pptx",...}' | node src/index.js
```
Not run directly — invoked by the backend's `pptx_service.py` via subprocess with JSON on stdin.

### Running All Services
```bash
./scripts/dev.sh     # starts frontend, backend, and pptx-engine in parallel
./scripts/setup.sh   # first-time setup: copies .env, installs deps, creates venv
./scripts/seed.sh    # seeds DB via psql (uses SUPABASE_DB_URL from .env)
```

### Tests
```bash
cd backend
pytest                              # run all tests
pytest tests/test_product_matcher.py  # run single test file
pytest tests/test_space_parser.py -k "test_parse"  # run matching tests
```
Tests use pytest with async support. Tests live in `backend/tests/`. No frontend or pptx-engine tests exist.

## Architecture

Three-service architecture: **Next.js frontend** → **FastAPI backend** → **Node.js PPTX engine**.

- **Frontend** (`frontend/`): Next.js App Router with Supabase Auth (via `@supabase/ssr`), Tailwind CSS v4. Multi-step wizard for creating presentations (client info → product selection → floor plan upload → review). Signup flow with email confirmation; profile completion on first login.
- **Backend** (`backend/`): FastAPI with asyncpg connection pool (not an ORM). Pydantic v2 for validation. Routes in `app/routers/`, business logic in `app/services/`. Config via `pydantic-settings` reading `.env`. Lifespan context manager handles asyncpg pool creation/teardown.
- **PPTX Engine** (`pptx-engine/`): Stateless CLI using pptxgenjs v4.0.1. Reads full JSON payload from stdin, writes `.pptx` to `outputPath`. Downloads remote images to temp files (8s timeout), cleans up after. Logs progress to stderr.
- **Supabase**: PostgreSQL database, file storage (private bucket with signed URLs), and authentication.

### Key Data Flow: Presentation Generation
1. Frontend submits creation request to backend API (`POST /api/presentations/generate`, multipart form)
2. Backend `pptx_service.py` fetches presentation + products + user profile from DB, computes markup pricing
3. Backend spawns `node pptx-engine/src/index.js` with JSON payload on stdin
4. Engine generates slides (cover → pricing → product slides → thank you), writes `.pptx` file
5. Backend uploads file to Supabase Storage, updates presentation record with `file_url`

### Backend Services
- **`pptx_service.py`**: Orchestrates PPTX generation — fetches DB data, builds JSON payload, spawns Node subprocess, uploads to Supabase Storage
- **`product_matcher.py`**: Matches products to space types with capacity-aware selection. Quantity rules: `per_workstation`, `per_room`, `per_floor`, `per_capacity`
- **`space_parser.py`**: Calls Google Gemini API to parse natural language office briefs into structured space requests
- **`storage_service.py`**: Uploads files to Supabase Storage and generates signed URLs (1h expiry)

### Backend API Endpoints
- `GET /health` — health check
- `GET/POST/PUT /api/profile` — get, create, update current user's profile (name, phone)
- `GET/POST /api/products` — list (supports `?category=` and `?search=` filters), create; `GET/PUT /api/products/{code}` — get, update
- `GET /api/products/categories` — distinct category list
- `GET/POST /api/presentations` — list (paginated), generate
- `POST /api/presentations/generate` — multipart form: client info + products JSON + floor plan file (consultant info auto-populated from user profile)
- `POST /api/presentations/auto-select` — auto-select products from structured space breakdown
- `POST /api/presentations/generate-from-brief` — AI-parse natural language brief via Gemini
- `GET /api/presentations/{id}` — detail with user profile (consultant) + products
- `GET /api/presentations/{id}/download` — signed download URL
- `DELETE /api/presentations/{id}` — delete

### Frontend Auth & API Pattern
- Auth via `@supabase/ssr` browser client, session token passed as `Authorization: Bearer` header
- Signup at `/signup`, email confirmation required, profile completed at `/complete-profile` on first login
- AuthProvider checks for profile existence; redirects to `/complete-profile` if missing
- API client in `frontend/src/lib/api.ts` with retry logic (exponential backoff, 2 attempts)
- Auth context in `frontend/src/components/auth/AuthProvider.tsx` provides `user`, `session`, `profile`
- Profile settings at `/settings` — users can update name and phone

### Product Slide Layout Rules
- `workstation` category: **1 product per slide** (workbench rule)
- All other categories: **1-3 products per slide**
- Layout files: `oneProduct.js`, `twoProducts.js`, `threeProducts.js` in `pptx-engine/src/layouts/`

## Slide Design Constants
- Layout: 16:9 (10" × 5.625")
- Primary color: `E31B23` (Envirotech red), Secondary: `2D2D2D` (dark charcoal)
- Text: `333333` (dark), `FFFFFF` (light)
- Fonts: Arial Bold (headers), Calibri (body)
- Theme constants defined in `pptx-engine/src/theme.js`

## Database
Four tables: `user_profiles` (PK: `user_id` UUID), `products` (PK: `product_code`), `presentations` (references `user_id`), `presentation_products` (junction table). Migration `002` adds product metadata columns. Migration `003` replaces `consultants` table with `user_profiles` and changes `presentations.consultant_id` to `presentations.user_id`. Schema in `supabase/migrations/`. Backend uses raw SQL via asyncpg with positional parameters (`$1`, `$2`), not an ORM. Helper functions in `backend/app/database.py`: `fetch_one()`, `fetch_all()`, `execute()`.

## Important Notes
- Frontend uses Next.js 16 which has breaking changes from earlier versions. Check `frontend/node_modules/next/dist/docs/` before using Next.js APIs.
- The presentations storage bucket is **private** — files are served via signed download URLs (1h expiry).
- Product prices include markup: `price * (1 + markup_percent / 100)`.
- Backend auth middleware (`app/middleware/auth.py`) validates Supabase Bearer tokens via the Supabase SDK, returns `AuthUser` with `id` and `email`.
- PPTX engine validates required fields on stdin JSON: `outputPath`, `clientName`, `officeAddress`, `suiteNumber`, `sqFt`, `consultant`, `products`, `totalCost`, `costPerSqFt`.
