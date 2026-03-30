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

-- Products (20 items across categories)
INSERT INTO products (product_code, name, specifications, price, markup_percent, category) VALUES
  -- Workstations
  ('WS-HAB-001', 'Height Adjustable Benching System', 'Electric height adjustable 24"–50", 60"W x 30"D laminate top, cable management tray, programmable controller', 1250.00, 15.00, 'workstation'),
  ('WS-FXD-002', 'Fixed Height Workstation', '29"H fixed frame, 48"W x 24"D laminate top, modesty panel, integrated wire management', 650.00, 15.00, 'workstation'),

  -- Task Seating
  ('TS-ERG-001', 'Ergonomic Task Chair', 'Mesh back, adjustable lumbar, 4D armrests, synchro-tilt, seat depth adjustment, 275 lb capacity', 485.00, 20.00, 'task_seating'),
  ('TS-STL-002', 'Drafting Stool', 'Pneumatic height adjustment 24"–34", foot ring, waterfall seat edge, 250 lb capacity', 320.00, 20.00, 'task_seating'),

  -- Meeting
  ('MT-CTB-001', 'Conference Table 8ft', 'Boat-shaped 96"W x 48"D, 1.25" thick laminate top, integrated power/data, seats 8', 1850.00, 12.00, 'meeting'),
  ('MT-CTB-002', 'Round Meeting Table 42"', '42" diameter laminate top, disc base, powder-coated steel, seats 4', 580.00, 12.00, 'meeting'),

  -- Lounge
  ('LG-SOF-001', 'Modular Lounge Sofa', '2-seat configuration, commercial-grade fabric, foam cushion, 68"W x 32"D x 30"H', 1420.00, 18.00, 'lounge'),
  ('LG-ARM-002', 'Lounge Armchair', 'Upholstered tub chair, commercial-grade fabric, 30"W x 28"D x 32"H, 300 lb capacity', 780.00, 18.00, 'lounge'),

  -- Reception
  ('RC-DSK-001', 'L-Shaped Reception Desk', '72"W x 30"D main surface, 48" return, transaction counter, ADA compliant', 2200.00, 15.00, 'reception'),
  ('RC-BNH-002', 'Reception Bench', '60"W upholstered bench, chrome sled base, commercial-grade vinyl, 500 lb capacity', 890.00, 15.00, 'reception'),

  -- Storage
  ('ST-LAT-001', 'Lateral File Cabinet 2-Drawer', '36"W x 20"D x 28"H, full-extension slides, anti-tip mechanism, legal/letter size', 420.00, 10.00, 'storage'),
  ('ST-BKC-002', 'Open Bookcase 5-Shelf', '36"W x 14"D x 72"H, adjustable shelves, laminate finish, 50 lb per shelf capacity', 340.00, 10.00, 'storage'),

  -- Tables
  ('TB-CFE-001', 'Café Height Table 36"', '36" round top, 42"H, powder-coated steel base, laminate top, seats 4', 380.00, 12.00, 'table'),
  ('TB-TRN-002', 'Training Table Flip-Top', '60"W x 24"D, flip-top mechanism, locking casters, integrated modesty panel', 520.00, 12.00, 'table'),

  -- Accessories
  ('AC-MNA-001', 'Monitor Arm Dual', 'Dual-screen mount, 17"–32" screens, VESA 75/100, cable management, desk clamp', 185.00, 25.00, 'accessory'),
  ('AC-KBT-002', 'Keyboard Tray Adjustable', 'Under-desk mount, 21"W platform, gel wrist rest, ±15° tilt, 360° swivel', 125.00, 25.00, 'accessory'),

  -- Phone Booths
  ('PB-SNG-001', 'Single Phone Booth', '44"W x 44"D x 90"H, acoustic panels, LED lighting, ventilation fan, integrated power', 4200.00, 10.00, 'phone_booth'),
  ('PB-DUO-002', 'Duo Phone Booth', '84"W x 44"D x 90"H, acoustic panels, LED lighting, ventilation, seats 2, integrated desk', 6800.00, 10.00, 'phone_booth'),

  -- Planters
  ('PL-RCT-001', 'Rectangular Planter Box', '36"L x 12"W x 32"H, fiberglass, drainage system, matte black finish', 220.00, 20.00, 'planter'),

  -- Gaming
  ('GM-DSK-001', 'Gaming Desk 60"', '60"W x 30"D, carbon fiber texture top, RGB LED strip, headphone hook, cup holder', 580.00, 15.00, 'gaming')
ON CONFLICT (product_code) DO NOTHING;
