# Envirotech Presentation Generator

Generate branded PowerPoint presentations for Envirotech clients with product selections, pricing summaries, and floor plans.

## Architecture

```
Next.js Frontend  →  FastAPI Backend  →  Node.js PPTX Engine (CLI)
(Supabase Auth)      (asyncpg)           (pptxgenjs)
                          ↓
                     Supabase (PostgreSQL + Storage)
```

## Quick Start

```bash
# 1. Install dependencies
./scripts/setup.sh

# 2. Configure environment
# Edit backend/.env with your Supabase credentials
# Edit frontend/.env.local with your Supabase public keys

# 3. Seed the database
psql "$SUPABASE_DB_URL" < backend/seed.sql

# 4. Start all services
./scripts/dev.sh
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/docs

## Presentation Flow

1. Log in with Supabase credentials
2. Click "Create New" on the dashboard
3. Fill in client info (name, address, sq ft, consultant)
4. Select products across categories with quantities
5. Optionally upload a floor plan image
6. Review pricing summary and generate
7. Download the PPTX from the presentation detail page

## PPTX Slide Structure

| Slide | Content |
|-------|---------|
| 1 | Cover — client name, address, date, consultant info |
| 2 | Pricing Summary — cost breakdown, product table, floor plan |
| 3+ | Product Slides — grouped by category (1-3 per slide) |
| Last | Thank You |

### Layout Rules

- **Workstations**: 1 product per slide (workbench rule)
- **All other categories**: up to 3 products per slide
- **Pricing table**: paginates at 14 rows per slide

## Known Limitations

### Images
- **Product images must be accessible URLs at generation time.** The PPTX engine pre-fetches images via HTTP before embedding. If a URL is unreachable (DNS failure, 404, timeout >8s), the image is silently skipped and the product card renders without it.
- **No image upload UI.** Product images are set via the `image_url` database field. There is no admin UI to upload product images yet — seed data uses placeholder URLs.
- **Floor plan image formats**: Only PNG and JPG are supported for floor plans in the PPTX. PDF floor plans will not render in slides.

### Pricing
- **Markup is applied to base price.** The displayed price = `price * (1 + markup_percent / 100)`. Extended = marked-up price * quantity. The frontend review and the PPTX pricing table both use this formula.
- **totalCost and costPerSqFt are computed server-side** from the product data, not from user input. The values shown in the frontend review are a client-side preview and may have minor floating-point differences.

### PPTX Output
- **No embedded fonts.** The PPTX references Arial and Calibri. If these are not installed on the viewer's machine, the system default font is substituted.
- **Cover slide background image** requires a `coverImagePath` field in the payload. Without it, the cover has a dark overlay on a blank background.
- **Long specification lists are truncated** to prevent overflow: 6 lines for single-product layouts, 4-5 lines for multi-product layouts.
- **Google Slides** may not render all formatting identically (e.g., transparency on overlays, precise font sizing).

### File Upload
- **Floor plan max size**: 10MB (enforced in both frontend and backend).
- **Generated PPTX files** are stored in Supabase Storage under the `presentations` bucket. The bucket must be created manually with public access.

### Authentication
- **No signup flow.** Users must be created in the Supabase dashboard. The app only supports email/password sign-in.
- **No role-based access.** All authenticated users can create, view, and delete any presentation.

### Database
- **No migration runner.** Schema changes must be applied manually via `psql` or the Supabase SQL editor. The initial schema is in `supabase/migrations/001_initial_schema.sql`.
- **Seed data uses placeholder image URLs** from placehold.co. Replace with actual product images for production use.
