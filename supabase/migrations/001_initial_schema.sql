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
