-- Add product metadata columns for AI-powered product selection
-- These fields enable deterministic product matching based on space breakdowns.

ALTER TABLE products
  ADD COLUMN space_type  text[] DEFAULT '{}',
  ADD COLUMN product_role text,
  ADD COLUMN capacity     integer,
  ADD COLUMN quantity_rule text;

-- Constrain product_role to known values
ALTER TABLE products
  ADD CONSTRAINT chk_product_role
  CHECK (product_role IN ('primary', 'secondary', 'accessory'));

-- Constrain quantity_rule to known values
ALTER TABLE products
  ADD CONSTRAINT chk_quantity_rule
  CHECK (quantity_rule IN ('per_workstation', 'per_room', 'per_capacity', 'per_floor'));

-- GIN index for efficient space_type array queries
CREATE INDEX idx_products_space_type ON products USING GIN (space_type);
