#Architecture
┌─────────────────────┐     ┌─────────────────────┐     ┌──────────────────┐
│   Next.js Frontend  │────▶│   FastAPI Backend    │────▶│  Node.js PPTX    │
│   (App Router)      │◀────│   (Python 3.11+)    │◀────│  Engine (CLI)    │
│   Supabase Auth     │     │   asyncpg + Supabase │     │  pptxgenjs       │
│   Tailwind CSS      │     │                     │     │                  │
└─────────────────────┘     └─────────────────────┘     └──────────────────┘
                                      │
                                      ▼
                            ┌─────────────────────┐
                            │  Supabase            │
                            │  - PostgreSQL        │
                            │  - Storage (public)  │
                            │  - Auth              │
                            └─────────────────────┘

#Database Schema
CREATE TABLE consultants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20)
);

CREATE TABLE products (
  product_code VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  specifications TEXT,
  image_url TEXT,
  price DECIMAL(10, 2),
  markup_percent DECIMAL(5, 2),
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE presentations (
  id SERIAL PRIMARY KEY,
  file_url TEXT,
  file_name VARCHAR(255),
  category VARCHAR(100),
  product_count INTEGER,
  sq_ft INTEGER,
  client_name VARCHAR(255),
  office_address TEXT,
  suite_number VARCHAR(100),
  floor_plan_url TEXT,
  consultant_id INTEGER REFERENCES consultants(id),
  generated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE presentation_products (
  id SERIAL PRIMARY KEY,
  presentation_id INTEGER REFERENCES presentations(id) ON DELETE CASCADE,
  product_code VARCHAR(50) REFERENCES products(product_code),
  quantity INTEGER NOT NULL,
  UNIQUE(presentation_id, product_code)
);

#Product Categories
workstation    → 1 per slide (workbench rule)
task_seating   → 1-3 per slide
meeting        → 1-3 per slide
lounge         → 1-3 per slide
reception      → 1-3 per slide
storage        → 1-3 per slide
table          → 1-3 per slide
accessory      → 1-3 per slide
phone_booth    → 1-3 per slide
gaming         → 1-3 per slide
planter        → 1-3 per slide

#Directory Structure
envirotech-pptx/
├── frontend/                    # Next.js app
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                    # Dashboard
│   │   │   ├── login/page.tsx
│   │   │   ├── create/page.tsx             # Multi-step creation wizard
│   │   │   └── presentations/[id]/page.tsx # View/download
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   └── AuthProvider.tsx
│   │   │   ├── create/
│   │   │   │   ├── ClientInfoStep.tsx
│   │   │   │   ├── ProductSelectStep.tsx
│   │   │   │   ├── FloorPlanUpload.tsx
│   │   │   │   ├── ReviewStep.tsx
│   │   │   │   └── StepWizard.tsx
│   │   │   ├── dashboard/
│   │   │   │   └── PresentationList.tsx
│   │   │   └── ui/                         # Shared UI components
│   │   ├── lib/
│   │   │   ├── supabase.ts                 # Supabase client
│   │   │   ├── api.ts                      # FastAPI client wrapper
│   │   │   └── types.ts                    # Shared TypeScript types
│   │   └── styles/
│   │       └── globals.css
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── next.config.js
│
├── backend/                     # FastAPI app
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app entry
│   │   ├── config.py            # Env vars, settings
│   │   ├── database.py          # asyncpg connection pool
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── consultant.py
│   │   │   ├── product.py
│   │   │   └── presentation.py
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── consultants.py
│   │   │   ├── products.py
│   │   │   └── presentations.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── pptx_service.py   # Calls Node.js engine
│   │   │   └── storage_service.py # Supabase storage ops
│   │   └── schemas/
│   │       ├── __init__.py
│   │       ├── consultant.py     # Pydantic models
│   │       ├── product.py
│   │       └── presentation.py
│   ├── requirements.txt
│   └── .env
│
├── pptx-engine/                 # Node.js PPTX generator
│   ├── src/
│   │   ├── index.js             # CLI entry: reads JSON stdin, writes PPTX
│   │   ├── slides/
│   │   │   ├── cover.js
│   │   │   ├── pricing.js
│   │   │   └── products.js
│   │   ├── layouts/
│   │   │   ├── oneProduct.js
│   │   │   ├── twoProducts.js
│   │   │   └── threeProducts.js
│   │   └── theme.js             # Colors, fonts, dimensions constants
│   ├── package.json
│   └── assets/
│       └── envirotech-logo.png  # Embedded logo
│
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql

#Slide Specifications (from example PDF)

Global Constants:
-Layout: 16:9 (10" × 5.625")
-Primary color: E31B23 (Envirotech red)
-Secondary: 2D2D2D (dark charcoal / header bars)
-Text dark: 333333
-Text light: FFFFFF
-Header font: Arial Bold
-Body font: Calibri
-Logo: top-right on content slides, top-left on cover

Slide 1 — Cover:
-Full-bleed background image (stock office photo — bundled as asset)
-Logo: top-left, ~2.5" wide
-Client name: bottom-left, ~36pt, white, serif-style bold
-Location: below client name, ~14pt, white
-Red horizontal line separator (~1" wide)
-Date: below separator, ~12pt, white
-Consultant name/email/phone: ~10pt, white, stacked

Slide 2 — Pricing Summary:
-Black header bar (full width, ~0.55" tall) with "PRICING" in white
-Logo: top-right
-Left column:
    -Address (large, ~28pt, bold)
    -Suite number (~18pt)
    -Red labels "PROJECT COST" / "SQ FT COST" (~10pt, red)
    -Dollar amounts (~36pt, bold)
    -"FOR X SQ FT" / "PER SQ FT" (~10pt, gray)
    -Floor plan image (thumbnail, ~4" wide)

-Right column:
    -Table with red header row
    -Columns: Room/Area, Quantity, Price, Extended
    -Rows for each product in presentation
    -Green checkmark icons on extended price column
    -Bold "Total" row at bottom
    -Alternating white/light-gray rows

Slides 3+ — Product Slides:
-Black header bar with "PROPOSED SOLUTIONS"
-Logo: top-right
-Category + subcategory subtitle (e.g., "Workstations | Height Adjustable Benching"):
    -Category in white/dark, subcategory in red
-Floor plan thumbnail: top-left below header (~4" wide)

-Product card(s): each has:
    -Product image
    -Product name (bold, italic-style, underlined with thin line)
    -"Specifications:" label (bold)
    -Spec list with red "+" bullets
    -"Warranty" in red at bottom of specs



Layout Rules:

-1 product (workstation category): Floor plan top-left, specs bottom-left, large product image right half
-2 products: Floor plan top-left, two product cards side-by-side on right
-3 products: Floor plan top-left, three product cards evenly spaced across bottom

Slide N (Final) — Thank You

Dark charcoal background (2D2D2D)
"Thank You" in large white bold serif (~48pt)
Envirotech logo bottom-left