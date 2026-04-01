# Envirotech Presentation Generator

Generate branded PowerPoint presentations for Envirotech clients with product selections, pricing summaries, and floor plans.

## Architecture

```
Next.js Frontend  →  FastAPI Backend  →  Node.js PPTX Engine (CLI)
(Supabase Auth)      (asyncpg)           (pptxgenjs)
                          ↓
                     Supabase (PostgreSQL + Storage)
```

| Service | Tech | Port | Purpose |
|---------|------|------|---------|
| **Frontend** | Next.js, Tailwind, Supabase Auth | 3000 | Multi-step wizard UI |
| **Backend** | FastAPI, asyncpg, Supabase SDK | 8000 | REST API, PPTX orchestration |
| **PPTX Engine** | Node.js CLI, pptxgenjs | — | Reads JSON stdin, writes .pptx file |
| **Database** | Supabase (PostgreSQL) | — | Products, consultants, presentations |
| **Storage** | Supabase Storage | — | Generated PPTX files, floor plans |

## Local Setup

### Prerequisites

- Node.js 20+
- Python 3.11+
- A Supabase project (database, storage, and auth already configured)

### 1. Install dependencies

```bash
./scripts/setup.sh
```

This installs npm dependencies (frontend + pptx-engine), creates the backend Python venv, and copies `.env.example` files if they don't already exist.

### 2. Configure environment

**`backend/.env`**:
```env
SUPABASE_URL=<your-supabase-url>
SUPABASE_KEY=<your-service-role-key>
SUPABASE_DB_URL=<your-pooler-connection-string>
GEMINI_API_KEY=<your-gemini-key>          # optional, for AI space parsing
PPTX_ENGINE_PATH=../pptx-engine
STORAGE_BUCKET=presentations
FRONTEND_URL=http://localhost:3000
EXTRA_CORS_ORIGINS=                       # optional, comma-separated
```

**`frontend/.env.local`**:
```env
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Start development

```bash
./scripts/dev.sh
```

Or run services separately in two terminals:

```bash
# Terminal 1: Backend
cd backend && source .venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend && npm run dev

# pptx-engine has no server — it runs as a subprocess of the backend
```

### 4. Verify

- **Frontend**: http://localhost:3000
- **Backend API docs**: http://localhost:8000/docs
- **Health check**: http://localhost:8000/health

## Development Workflow

### Creating a presentation (E2E flow)

1. Sign in at http://localhost:3000/login
2. Click **Create New** on the dashboard
3. Fill in client info (name, address, sq ft)
4. Select products across categories with quantities
5. Optionally upload a floor plan image (PNG/JPG, max 10MB)
6. Review the pricing summary
7. Click **Generate Presentation**
8. Download the PPTX from the presentation detail page

### PPTX slide structure

| Slide | Content |
|-------|---------|
| 1 | Cover — client name, address, date, consultant info |
| 2+ | Pricing Summary — cost breakdown, product table, floor plan |
| 3+ | Product Slides — grouped by category (1-3 per slide) |
| Last | Thank You |

**Layout rules:**
- Workstations: 1 product per slide
- All other categories: up to 3 products per slide
- Pricing table: paginates at 14 rows per slide

### API endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Health check |
| GET/POST/PUT | `/api/profile` | Get, create, update current user's profile |
| GET | `/api/products` | List products (`?category=`, `?search=`) |
| POST | `/api/products` | Create product |
| GET/PUT | `/api/products/{code}` | Get or update product |
| GET | `/api/products/categories` | Distinct category list |
| GET | `/api/presentations` | List presentations (paginated) |
| GET | `/api/presentations/{id}` | Presentation detail with products |
| GET | `/api/presentations/{id}/download` | Signed download URL (1h expiry) |
| POST | `/api/presentations/generate` | Create + generate PPTX (multipart form) |
| POST | `/api/presentations/auto-select` | Auto-select products from space breakdown |
| POST | `/api/presentations/generate-from-brief` | AI-parse brief via Gemini |
| DELETE | `/api/presentations/{id}` | Delete presentation |

### Project structure

```
├── frontend/               # Next.js app (App Router, Tailwind)
│   └── src/
│       ├── app/            # Pages: dashboard, create wizard, detail
│       ├── components/     # UI components by feature
│       └── lib/            # API client, types, Supabase client
├── backend/                # FastAPI app
│   └── app/
│       ├── routers/        # API route handlers
│       ├── services/       # PPTX generation, storage uploads
│       ├── schemas/        # Pydantic request/response models
│       └── config.py       # Environment settings
├── pptx-engine/            # Node.js CLI (reads JSON stdin → writes .pptx)
│   └── src/
│       ├── slides/         # Slide generators (cover, pricing, products, thankYou)
│       ├── layouts/        # Product card layouts (1/2/3 per slide)
│       └── theme.js        # Colors, fonts, dimensions
├── supabase/migrations/    # Database schema SQL
├── scripts/                # setup.sh, dev.sh, seed.sh
└── docs/                   # Setup guides
```

## Troubleshooting

### Backend won't start

**"connection refused" to database** — Check `SUPABASE_DB_URL` in `backend/.env`. The connection string format differs between Supabase's pooler and direct connections. Use the **pooler** URI from Settings → Database → Connection string.

**ModuleNotFoundError** — Activate the venv: `cd backend && source .venv/bin/activate`

### Frontend shows "Failed to fetch"

**CORS errors** — Ensure `FRONTEND_URL` in `backend/.env` matches exactly (e.g., `http://localhost:3000`, not `http://127.0.0.1:3000`).

**API 404s** — All backend routes are prefixed with `/api/`. Check that `NEXT_PUBLIC_API_URL` does NOT include a trailing slash.

### PPTX generation fails

**"PPTX engine failed (exit 1)"** — Check the stderr output in the backend logs. Common causes:
- `PPTX_ENGINE_PATH` doesn't point to the correct directory
- `node_modules` not installed in pptx-engine (`cd pptx-engine && npm install`)
- Node.js not available in the backend container (Docker) or system (local)

**Images missing in slides** — Product images are fetched at generation time. If a URL returns 404, times out (>8s), or is unreachable, the image is silently skipped. Check `image_url` values in the products table.

### Docker issues

**"pptx-engine: no such file or directory"** — The backend container mounts `./pptx-engine` as a volume. Run `npm install` in the pptx-engine directory first so `node_modules` exists.

**Port conflicts** — Change port mappings in `docker-compose.yml` if 3000 or 8000 are already in use.

## Known Limitations

- **No embedded fonts.** The PPTX references Arial and Calibri. The viewer's system substitutes defaults if these aren't installed.
- **No image upload UI.** Product images are set via the `image_url` database field directly.
- **Floor plans**: Only PNG and JPG render in slides. PDF floor plans won't be embedded.
- **No role-based access.** All authenticated users can manage any presentation.
- **No migration runner.** Schema changes are applied manually via SQL.
- **Google Slides** may not render all formatting identically (transparency, precise font sizing).
