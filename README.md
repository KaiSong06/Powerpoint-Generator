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

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.11+
- Docker & Docker Compose (for containerized setup)
- A Supabase project ([setup guide](docs/SUPABASE_SETUP.md))

### 1. Clone and install

```bash
git clone <repo-url> && cd envirotech-pptx
./scripts/setup.sh
```

This copies `.env.example` files, installs npm dependencies (frontend + pptx-engine), and creates the backend Python venv.

### 2. Configure environment

Fill in your Supabase credentials in two files:

**`backend/.env`** — database, storage, and API key:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=eyJ...your-service-role-key
SUPABASE_DB_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
PPTX_ENGINE_PATH=../pptx-engine
STORAGE_BUCKET=presentations
FRONTEND_URL=http://localhost:3000
```

**`frontend/.env.local`** — public Supabase keys and API URL:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

See [`.env.example`](.env.example) for a complete reference of all variables.

### 3. Set up Supabase

Follow [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) to:
- Run the database migration (`supabase/migrations/001_initial_schema.sql`)
- Seed test data (`backend/seed.sql`) — 3 consultants, 22 products across 11 categories
- Create storage buckets (`presentations`, `floor-plans`)
- Create an auth user for login

### 4. Start development

**With Docker:**
```bash
./scripts/dev.sh
```

**Without Docker (3 terminals):**
```bash
# Terminal 1: Backend
cd backend && source .venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend && npm run dev

# pptx-engine has no server — it runs as a subprocess of the backend
```

### 5. Verify

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
| GET | `/api/products` | List all products |
| GET | `/api/products?category=X` | Filter by category |
| GET | `/api/consultants` | List consultants |
| GET | `/api/presentations` | List presentations |
| GET | `/api/presentations/{id}` | Presentation detail with products |
| GET | `/api/presentations/{id}/download` | Signed download URL (1h expiry) |
| POST | `/api/presentations/generate` | Create + generate PPTX (multipart form) |
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
- **No signup flow.** Users must be created in the Supabase dashboard.
- **No role-based access.** All authenticated users can manage any presentation.
- **No migration runner.** Schema changes are applied manually via SQL.
- **Google Slides** may not render all formatting identically (transparency, precise font sizing).
