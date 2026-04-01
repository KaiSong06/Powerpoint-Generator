-- Migration: Replace consultants table with user_profiles
-- User profiles store consultant info (name, email, phone) tied to auth users

CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add user_id to presentations (replaces consultant_id)
ALTER TABLE presentations ADD COLUMN user_id UUID;

-- Migrate existing data: seed user_profiles from consultants that match an auth user
INSERT INTO user_profiles (user_id, email, name, phone)
SELECT au.id, au.email, c.name, c.phone
FROM consultants c
JOIN auth.users au ON lower(au.email) = lower(c.email)
ON CONFLICT (user_id) DO NOTHING;

-- Backfill user_id on existing presentations
UPDATE presentations p
SET user_id = au.id
FROM consultants c
JOIN auth.users au ON lower(au.email) = lower(c.email)
WHERE p.consultant_id = c.id;

-- Drop old column and table
ALTER TABLE presentations DROP COLUMN consultant_id;
DROP TABLE consultants;
