-- Seed data for Envirotech PPTX Generator
-- Run against your Supabase PostgreSQL instance

-- Consultants
INSERT INTO consultants (name, email, phone) VALUES
  ('Sarah Mitchell', 'sarah.mitchell@envirotech.com', '555-0101'),
  ('James Park', 'james.park@envirotech.com', '555-0102'),
  ('Maria Gonzalez', 'maria.gonzalez@envirotech.com', '555-0103'),
  ('David Chen', 'david.chen@envirotech.com', '555-0104'),
  ('Emily Rhodes', 'emily.rhodes@envirotech.com', '555-0105')
ON CONFLICT DO NOTHING;

-- Products (20+ items across all categories with placeholder images)
INSERT INTO products (product_code, name, specifications, image_url, price, markup_percent, category) VALUES
  -- Workstations
  ('WS-HAB-001', 'Height Adjustable Benching System', 'Electric height adjustable 24"–50", 60"W x 30"D laminate top, cable management tray, programmable controller', 'https://placehold.co/600x400/E31B23/FFFFFF?text=WS-HAB-001', 1250.00, 15.00, 'workstation'),
  ('WS-FXD-002', 'Fixed Height Workstation', '29"H fixed frame, 48"W x 24"D laminate top, modesty panel, integrated wire management', 'https://placehold.co/600x400/E31B23/FFFFFF?text=WS-FXD-002', 650.00, 15.00, 'workstation'),

  -- Task Seating
  ('TS-ERG-001', 'Ergonomic Task Chair', 'Mesh back, adjustable lumbar, 4D armrests, synchro-tilt, seat depth adjustment, 275 lb capacity', 'https://placehold.co/600x400/2D2D2D/FFFFFF?text=TS-ERG-001', 485.00, 20.00, 'task_seating'),
  ('TS-STL-002', 'Drafting Stool', 'Pneumatic height adjustment 24"–34", foot ring, waterfall seat edge, 250 lb capacity', 'https://placehold.co/600x400/2D2D2D/FFFFFF?text=TS-STL-002', 320.00, 20.00, 'task_seating'),

  -- Meeting
  ('MT-CTB-001', 'Conference Table 8ft', 'Boat-shaped 96"W x 48"D, 1.25" thick laminate top, integrated power/data, seats 8', 'https://placehold.co/600x400/4A4A4A/FFFFFF?text=MT-CTB-001', 1850.00, 12.00, 'meeting'),
  ('MT-CTB-002', 'Round Meeting Table 42"', '42" diameter laminate top, disc base, powder-coated steel, seats 4', 'https://placehold.co/600x400/4A4A4A/FFFFFF?text=MT-CTB-002', 580.00, 12.00, 'meeting'),

  -- Lounge
  ('LG-SOF-001', 'Modular Lounge Sofa', '2-seat configuration, commercial-grade fabric, foam cushion, 68"W x 32"D x 30"H', 'https://placehold.co/600x400/6B4E3D/FFFFFF?text=LG-SOF-001', 1420.00, 18.00, 'lounge'),
  ('LG-ARM-002', 'Lounge Armchair', 'Upholstered tub chair, commercial-grade fabric, 30"W x 28"D x 32"H, 300 lb capacity', 'https://placehold.co/600x400/6B4E3D/FFFFFF?text=LG-ARM-002', 780.00, 18.00, 'lounge'),

  -- Reception
  ('RC-DSK-001', 'L-Shaped Reception Desk', '72"W x 30"D main surface, 48" return, transaction counter, ADA compliant', 'https://placehold.co/600x400/1A5276/FFFFFF?text=RC-DSK-001', 2200.00, 15.00, 'reception'),
  ('RC-BNH-002', 'Reception Bench', '60"W upholstered bench, chrome sled base, commercial-grade vinyl, 500 lb capacity', 'https://placehold.co/600x400/1A5276/FFFFFF?text=RC-BNH-002', 890.00, 15.00, 'reception'),

  -- Storage
  ('ST-LAT-001', 'Lateral File Cabinet 2-Drawer', '36"W x 20"D x 28"H, full-extension slides, anti-tip mechanism, legal/letter size', 'https://placehold.co/600x400/7D7D7D/FFFFFF?text=ST-LAT-001', 420.00, 10.00, 'storage'),
  ('ST-BKC-002', 'Open Bookcase 5-Shelf', '36"W x 14"D x 72"H, adjustable shelves, laminate finish, 50 lb per shelf capacity', 'https://placehold.co/600x400/7D7D7D/FFFFFF?text=ST-BKC-002', 340.00, 10.00, 'storage'),

  -- Tables
  ('TB-CFE-001', 'Café Height Table 36"', '36" round top, 42"H, powder-coated steel base, laminate top, seats 4', 'https://placehold.co/600x400/8B6914/FFFFFF?text=TB-CFE-001', 380.00, 12.00, 'table'),
  ('TB-TRN-002', 'Training Table Flip-Top', '60"W x 24"D, flip-top mechanism, locking casters, integrated modesty panel', 'https://placehold.co/600x400/8B6914/FFFFFF?text=TB-TRN-002', 520.00, 12.00, 'table'),

  -- Accessories
  ('AC-MNA-001', 'Monitor Arm Dual', 'Dual-screen mount, 17"–32" screens, VESA 75/100, cable management, desk clamp', 'https://placehold.co/600x400/333333/FFFFFF?text=AC-MNA-001', 185.00, 25.00, 'accessory'),
  ('AC-KBT-002', 'Keyboard Tray Adjustable', 'Under-desk mount, 21"W platform, gel wrist rest, ±15° tilt, 360° swivel', 'https://placehold.co/600x400/333333/FFFFFF?text=AC-KBT-002', 125.00, 25.00, 'accessory'),

  -- Phone Booths
  ('PB-SNG-001', 'Single Phone Booth', '44"W x 44"D x 90"H, acoustic panels, LED lighting, ventilation fan, integrated power', 'https://placehold.co/600x400/1B4F72/FFFFFF?text=PB-SNG-001', 4200.00, 10.00, 'phone_booth'),
  ('PB-DUO-002', 'Duo Phone Booth', '84"W x 44"D x 90"H, acoustic panels, LED lighting, ventilation, seats 2, integrated desk', 'https://placehold.co/600x400/1B4F72/FFFFFF?text=PB-DUO-002', 6800.00, 10.00, 'phone_booth'),

  -- Planters
  ('PL-RCT-001', 'Rectangular Planter Box', '36"L x 12"W x 32"H, fiberglass, drainage system, matte black finish', 'https://placehold.co/600x400/2E7D32/FFFFFF?text=PL-RCT-001', 220.00, 20.00, 'planter'),
  ('PL-CYL-002', 'Cylindrical Floor Planter', '18" diameter x 36"H, fiberglass, built-in reservoir, white finish', 'https://placehold.co/600x400/2E7D32/FFFFFF?text=PL-CYL-002', 180.00, 20.00, 'planter'),

  -- Gaming
  ('GM-DSK-001', 'Gaming Desk 60"', '60"W x 30"D, carbon fiber texture top, RGB LED strip, headphone hook, cup holder', 'https://placehold.co/600x400/9B59B6/FFFFFF?text=GM-DSK-001', 580.00, 15.00, 'gaming'),
  ('GM-CHR-002', 'Gaming Chair Pro', 'Racing style, 4D armrests, lumbar + headrest pillows, 180° recline, 300 lb capacity', 'https://placehold.co/600x400/9B59B6/FFFFFF?text=GM-CHR-002', 420.00, 15.00, 'gaming')
ON CONFLICT (product_code) DO UPDATE SET
  image_url = EXCLUDED.image_url,
  specifications = EXCLUDED.specifications,
  price = EXCLUDED.price;
