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
Requires `.env` in `backend/` with: `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_DB_URL`. Optional: `PPTX_ENGINE_PATH` (default `../pptx-engine`), `STORAGE_BUCKET` (default `presentations`), `FRONTEND_URL` (default `http://localhost:3000`).

### PPTX Engine (Node.js CLI)
```bash
cd pptx-engine
npm install
echo '{"outputPath":"test.pptx",...}' | node src/index.js
```
Not run directly — invoked by the backend's `pptx_service.py` via subprocess with JSON on stdin.

## Architecture

Three-service architecture: **Next.js frontend** → **FastAPI backend** → **Node.js PPTX engine**.

- **Frontend** (`frontend/`): Next.js App Router with Supabase Auth (via `@supabase/ssr`), Tailwind CSS v4. Multi-step wizard for creating presentations (client info → product selection → floor plan upload → review).
- **Backend** (`backend/`): FastAPI with asyncpg connection pool (not an ORM). Pydantic v2 for validation. Routes in `app/routers/`, business logic in `app/services/`. Config via `pydantic-settings` reading `.env`.
- **PPTX Engine** (`pptx-engine/`): Stateless CLI using pptxgenjs. Reads full JSON payload from stdin, writes `.pptx` to `outputPath`. Downloads remote images to temp files, cleans up after. Logs progress to stderr.
- **Supabase**: PostgreSQL database, file storage (private bucket with signed URLs), and authentication.

### Key Data Flow: Presentation Generation
1. Frontend submits creation request to backend API
2. Backend `pptx_service.py` fetches presentation + products + consultant from DB, computes markup pricing
3. Backend spawns `node pptx-engine/src/index.js` with JSON payload on stdin
4. Engine generates slides (cover → pricing → product slides → thank you), writes `.pptx` file
5. Backend uploads file to Supabase Storage, updates presentation record with `file_url`

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
Four tables: `consultants`, `products` (PK: `product_code`), `presentations`, `presentation_products` (junction table). Schema in `supabase/migrations/001_initial_schema.sql`. Backend uses raw SQL via asyncpg, not an ORM.

## Important Notes
- Frontend uses Next.js 16 which has breaking changes from earlier versions. Check `frontend/node_modules/next/dist/docs/` before using Next.js APIs.
- The presentations storage bucket is **private** — files are served via signed download URLs.
- Product prices include markup: `price * (1 + markup_percent / 100)`.
