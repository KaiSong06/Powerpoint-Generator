# Supabase Setup Guide

This guide walks through creating and configuring the Supabase project that backs the Envirotech PowerPoint Generator.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Choose an organization, set a project name (e.g. `envirotech`), and pick a strong database password
4. Select a region close to your users and click **Create new project**
5. Wait for the project to finish provisioning (~2 minutes)

## 2. Collect Credentials

Navigate to **Settings → API** in the Supabase dashboard. You need three values:

| Value | Where to find it | Used by |
|-------|-------------------|---------|
| **Project URL** | Settings → API → Project URL | Backend + Frontend |
| **anon (public) key** | Settings → API → `anon` / `public` | Backend + Frontend |
| **service_role key** | Settings → API → `service_role` / `secret` | Backend only |

For the database connection string, go to **Settings → Database → Connection string → URI** and copy the URI. Replace `[YOUR-PASSWORD]` with the database password you set during project creation.

Copy these values into your environment files:

```bash
# backend/.env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=eyJ...your-anon-key
SUPABASE_DB_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

# frontend/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 3. Run Database Migrations

### Option A: Using psql (recommended)

If you have `psql` installed and your `SUPABASE_DB_URL` is set in `backend/.env`:

```bash
./scripts/seed.sh
```

Then seed the product/consultant data:

```bash
psql "$SUPABASE_DB_URL" < backend/seed.sql
```

### Option B: Supabase SQL Editor

1. Open **SQL Editor** in the Supabase dashboard
2. Click **New Query**
3. Paste the contents of `supabase/migrations/001_initial_schema.sql` and click **Run**
4. Create another query, paste the contents of `backend/seed.sql`, and click **Run**

## 4. Create Storage Buckets

The app stores generated PPTX files and uploaded floor plans in Supabase Storage.

1. Go to **Storage** in the Supabase dashboard
2. Click **New Bucket** and create:

| Bucket name | Public | Purpose |
|-------------|--------|---------|
| `presentations` | **No** (private) | Generated PPTX files (contain sensitive client data) |
| `floor-plans` | Yes | Uploaded floor plan images |

3. **`presentations` bucket** (private) — the backend generates time-limited signed URLs for downloads:
   - Go to **Policies** tab on the bucket
   - Add a policy for **INSERT** with target role `service_role`:
     ```sql
     true
     ```
   - No SELECT policy needed — the backend uses the service role key to generate signed URLs

4. **`floor-plans` bucket** (public) — floor plan images are embedded in slides and need direct access:
   - Go to **Policies** tab on the bucket
   - Add a policy for **INSERT** with target role `authenticated`:
     ```sql
     true
     ```
   - Add a policy for **SELECT** with target role `public`:
     ```sql
     true
     ```

> **Note:** The `presentations` bucket is private because PPTX files contain sensitive client data (pricing, addresses, internal costs). Downloads go through the backend, which verifies authentication and issues a signed URL valid for 1 hour. Use the `service_role` key in `backend/.env` to ensure the backend can generate signed URLs.

## 5. Configure Authentication

1. Go to **Authentication → Providers** in the Supabase dashboard
2. Ensure **Email** provider is enabled (it is by default)
3. Optionally disable "Confirm email" under **Authentication → Settings** for local development

### Create Your First User

1. Go to **Authentication → Users**
2. Click **Add User → Create New User**
3. Enter an email and password
4. This user can now log in to the frontend at `http://localhost:3000/login`

## 6. Create Consultant Records

Consultants are stored in the database, not in Supabase Auth. After running the seed SQL, you'll have 3 consultants pre-loaded. To add more:

```sql
INSERT INTO consultants (name, email, phone)
VALUES ('Jane Smith', 'jane@envirotech.com', '555-0199');
```

## 7. Verify Setup

Run through this checklist to confirm everything is connected:

- [ ] `http://localhost:8000/health` returns `{"status": "ok"}`
- [ ] `http://localhost:3000/login` loads the login page
- [ ] You can sign in with the user you created
- [ ] The create wizard shows products and consultants from the database
- [ ] Generating a presentation produces a downloadable PPTX

## Troubleshooting

### "relation does not exist" errors
The migration hasn't been applied. Run `001_initial_schema.sql` through the SQL Editor.

### "no rows in result set" on product/consultant endpoints
The seed data hasn't been loaded. Run `backend/seed.sql` through the SQL Editor.

### CORS errors in browser console
Check that `FRONTEND_URL` in `backend/.env` matches your frontend URL exactly (including port). The backend uses this for CORS `allow_origins`.

### "Bucket not found" when generating presentations
Create the `presentations` bucket in Supabase Storage (see step 4).

### "Invalid login credentials"
Make sure you created a user in Supabase Auth (step 5), not just a consultant record.
