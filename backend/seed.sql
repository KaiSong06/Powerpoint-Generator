-- Seed data for Envirotech PPTX Generator
-- Run against your Supabase PostgreSQL instance

-- User profiles are created via the signup flow (no seed data needed)

-- Clear existing products
DELETE FROM presentation_products;
DELETE FROM products;

-- Products from Master Product Catalog
-- All products use 30% markup
-- Image URLs point to the public 'product-images' Supabase Storage bucket

-- Café Furniture
INSERT INTO products (product_code, name, specifications, image_url, price, markup_percent, category, space_type, product_role, capacity, quantity_rule) VALUES
  ('30SQX', 'Groupe Lacasse Square Table', '30" SQUARE TABLE WITH ROUNDED CORNERS. LAMINATE TOP. METAL X-BASE. CHOICE OF VENDOR''S STANDARD FINISHES.', 'https://xicteexcnsbtrmvnvcpz.supabase.co/storage/v1/object/public/product-images/30SQX.jpg', 501.18, 30.00, 'cafe_furniture', '{break_room}', 'primary', 4, 'per_room'),
  ('36RDC', 'Groupe Lacasse Round Table', '36" ROUND TABLE. LAMINATE TOP. METAL X-BASE. CHOICE OF VENDOR''S STANDARD FINISHES.', 'https://xicteexcnsbtrmvnvcpz.supabase.co/storage/v1/object/public/product-images/36RDC.jpeg', 569.71, 30.00, 'cafe_furniture', '{break_room}', 'primary', 4, 'per_room'),
  ('3060RT', 'Groupe Lacasse Rectangular Table', '30" X 60" RECTANGULAR TABLE. LAMINATE TOP. METAL T-BASE. CHOICE OF VENDOR''S STANDARD FINISHES.', 'https://xicteexcnsbtrmvnvcpz.supabase.co/storage/v1/object/public/product-images/3060RT.jpg', 424.27, 30.00, 'cafe_furniture', '{break_room}', 'primary', 4, 'per_room'),
  ('11054', 'Allseating Tuck Poly Stacking Chair', 'STACKING CHAIR. POLY SEAT AND BACK. 4 LEG METAL BASE. CHOICE OF VENDOR''S STANDARD FINISHES.', 'https://xicteexcnsbtrmvnvcpz.supabase.co/storage/v1/object/public/product-images/11054.jpg', 144.00, 30.00, 'cafe_furniture', '{break_room}', 'secondary', 1, 'per_capacity'),
  ('11055NA', 'Allseating Tuck Poly Bar Stool', 'BAR STOOL. POLY SEAT AND BACK. 4 LEG METAL BASE. CHOICE OF VENDOR''S STANDARD FINISHES.', 'https://xicteexcnsbtrmvnvcpz.supabase.co/storage/v1/object/public/product-images/11055NA.jpg', 237.20, 30.00, 'cafe_furniture', '{break_room}', 'secondary', 1, 'per_capacity'),
  ('12701', 'Magis Air Stacking Chair', 'MAGIS AIR POLY STACKING CHAIR. WHITE. RENEWED.', 'https://xicteexcnsbtrmvnvcpz.supabase.co/storage/v1/object/public/product-images/12701.jpg', 50.00, 30.00, 'cafe_furniture', '{break_room}', 'secondary', 1, 'per_capacity'),
  ('309642AXIS', 'Workspace48 Axis Bar Height Table', 'BAR HEIGHT TABLE 30"D X 96"W X 42"H. LAMINATE TOP WITH METAL FRAME. CHOICE OF VENDOR''S STANDARD FINISHES.', 'https://xicteexcnsbtrmvnvcpz.supabase.co/storage/v1/object/public/product-images/309642AXIS.jpg', 743.75, 30.00, 'cafe_furniture', '{break_room}', 'primary', 8, 'per_room'),
  ('369642NEX', 'Groupe Lacasse Nex Bar Height Table', 'BAR HEIGHT TABLE 36"D X 96"W X 42"H. 1" LAMINATE WITH PARTIAL MODESTY AND FULL GABLES. CHOICE OF VENDOR''S STANDARD FINISHES.', 'https://xicteexcnsbtrmvnvcpz.supabase.co/storage/v1/object/public/product-images/369642NEX.jpg', 798.98, 30.00, 'cafe_furniture', '{break_room}', 'primary', 8, 'per_room'),
  ('A1054', 'Allseating Allora Poly Stacking Chair', 'STACKING CHAIR. POLY SHELL; METAL LEGS. CHOICE OF VENDOR''S STANDARD FINISHES.', 'https://xicteexcnsbtrmvnvcpz.supabase.co/storage/v1/object/public/product-images/A1054.jpg', 102.40, 30.00, 'cafe_furniture', '{break_room}', 'secondary', 1, 'per_capacity'),
  ('GMBSCRSCN', 'Allseating Game Poly Bar Stool', 'BAR HEIGHT STOOL. CHARCOAL POLY SHELL. CHROME LEGS.', 'https://xicteexcnsbtrmvnvcpz.supabase.co/storage/v1/object/public/product-images/GMBSCRSCN.jpg', 134.75, 30.00, 'cafe_furniture', '{break_room}', 'secondary', 1, 'per_capacity'),
  ('HC60E', 'Groupe Lacasse Hiphop Midback Bench', 'MIDBACK UPHOLSTERED BENCH. 60"W X 30"D. BENDED METAL LEGS. CHOICE OF VENDOR''S GRADE 1 UPHOLSTERY.', 'https://xicteexcnsbtrmvnvcpz.supabase.co/storage/v1/object/public/product-images/HC60E.jpeg', 1263.35, 30.00, 'cafe_furniture', '{break_room}', 'secondary', 3, 'per_capacity'),

-- Conference Seating
  ('12510', 'Haworth Zody Mesh Back Conference Chair', 'GAS LIFT, SEAT DEPTH ADJUSTMENT. FIXED ARMS. MESH BACK; UPHOLSTERED SEAT. RENEWED+.', 'https://xicteexcnsbtrmvnvcpz.supabase.co/storage/v1/object/public/product-images/12510.jpg', 165.00, 30.00, 'conference_seating', '{conference_room,huddle_room,training_room}', 'secondary', 1, 'per_capacity'),
  ('42040', 'Allseating Dart Conference Chair', 'GAS LIFT, SYNCHRO TILT. ALUMINUM BASE & FIXED ARM. CHOICE OF VENDOR''S STANDARD FINISHES.', 'https://xicteexcnsbtrmvnvcpz.supabase.co/storage/v1/object/public/product-images/42040.jpg', 350.00, 30.00, 'conference_seating', '{conference_room,huddle_room,training_room}', 'secondary', 1, 'per_capacity'),
  ('METMPU', 'Workspace48 Metro Midback Chair', 'GAS LIFT; FIXED ARM. POLISHED STAINLESS FRAME/BASE. CHOICE OF BLACK OR WHITE FAUX-LEATHER.', 'https://xicteexcnsbtrmvnvcpz.supabase.co/storage/v1/object/public/product-images/METMPU.jpg', 280.00, 30.00, 'conference_seating', '{conference_room,huddle_room,training_room}', 'secondary', 1, 'per_capacity'),

-- Guest Seating
  ('11054WAMESH', 'Allseating Tuck Mesh Back Chair', 'SIDE CHAIR WITH ARMS. 4 LEG BASE. MESH BACK; UPHOLSTERED SEAT. CHOICE OF VENDOR''S STANDARD FINISHES.', 'https://xicteexcnsbtrmvnvcpz.supabase.co/storage/v1/object/public/product-images/11054WAMESH.jpg', 206.00, 30.00, 'guest_seating', '{reception,huddle_room}', 'secondary', 1, 'per_capacity'),
  ('11629', 'Knoll Moment Side Chair', 'CHROME SLED BASE. FIXED ARMS. BLACK POLY BACK. BLACK UPHOLSTERED SEAT. RENEWED.', 'https://xicteexcnsbtrmvnvcpz.supabase.co/storage/v1/object/public/product-images/11629.jpg', 105.00, 30.00, 'guest_seating', '{reception,huddle_room}', 'secondary', 1, 'per_capacity'),
  ('12632', 'Steelcase Qivi Side Chair', 'BLACK SLED BASE. FIXED ARMS. BLACK MESH BACK. BLACK UPHOLSTERED SEAT. RENEWED.', 'https://xicteexcnsbtrmvnvcpz.supabase.co/storage/v1/object/public/product-images/12632.jpg', 90.00, 30.00, 'guest_seating', '{reception,huddle_room}', 'secondary', 1, 'per_capacity'),

-- Lounge
  ('93.43.15.20', 'Round Side Table', 'MARBLE TOP. IRON FRAME. BLACK. 16"D X 18"H.', 'https://xicteexcnsbtrmvnvcpz.supabase.co/storage/v1/object/public/product-images/93.43.15.20.jpg', 69.00, 30.00, 'lounge', '{lounge,break_room,reception}', 'accessory', NULL, 'per_room'),
  ('12823', 'Anders Upholstered Sectional (Ivory)', 'IVORY UPHOLSTERY WITH SILVER LEGS. 117"W X 63"D CHAISE.', 'https://xicteexcnsbtrmvnvcpz.supabase.co/storage/v1/object/public/product-images/12823.jpg', 570.00, 30.00, 'lounge', '{lounge,reception}', 'primary', 4, 'per_room'),
  ('12822', 'Anders Upholstered Sectional (Grey)', 'GREY UPHOLSTERY WITH SILVER LEGS. 117"W X 63"D CHAISE.', 'https://xicteexcnsbtrmvnvcpz.supabase.co/storage/v1/object/public/product-images/12822.jpg', 570.00, 30.00, 'lounge', '{lounge,reception}', 'primary', 4, 'per_room'),
  ('12812', 'Estella Armchair Black', 'BLACK SALT AND PEPPER BOUCLE UPHOLSTERY. BLACK METAL LEGS. 24"W X 23"D X 31.5"H.', 'https://xicteexcnsbtrmvnvcpz.supabase.co/storage/v1/object/public/product-images/12812.jpg', 195.00, 30.00, 'lounge', '{lounge,break_room,reception}', 'secondary', 1, 'per_capacity'),
  ('12810', 'Estella Armchair Charcoal', 'CHARCOAL PLUSH UPHOLSTERY. BLACK METAL LEGS. 24"W X 23"D X 31.5"H.', 'https://xicteexcnsbtrmvnvcpz.supabase.co/storage/v1/object/public/product-images/12810.jpg', 195.00, 30.00, 'lounge', '{lounge,break_room,reception}', 'secondary', 1, 'per_capacity'),
  ('12813', 'Reina Armchair Grey', 'MATTE LINEN GREY UPHOLSTERY. BLACK LEGS. 29.8"H x 30"W x 37.3"D.', 'https://xicteexcnsbtrmvnvcpz.supabase.co/storage/v1/object/public/product-images/12813.jpg', 440.00, 30.00, 'lounge', '{lounge,break_room,reception}', 'secondary', 1, 'per_capacity'),
  ('12814', 'Renee Armchair Ivory', 'SHELL BOUCLE UPHOLSTERY. MATTE BLACK STEEL LEGS. 30.8" X 30.8" X 32.8".', 'https://xicteexcnsbtrmvnvcpz.supabase.co/storage/v1/object/public/product-images/12814.jpg', 290.00, 30.00, 'lounge', '{lounge,break_room,reception}', 'secondary', 1, 'per_capacity'),
  ('12815', 'Gretchen Armchair Grey', 'SLATE GREY UPHOLSTERY. WALNUT ASH LEGS. 32.3" X 31.5" X 32.5".', 'https://xicteexcnsbtrmvnvcpz.supabase.co/storage/v1/object/public/product-images/12815.jpg', 235.00, 30.00, 'lounge', '{lounge,break_room,reception}', 'secondary', 1, 'per_capacity'),
  ('SKU359', 'Round Walnut Coffee Table', 'SOLID AMERICAN BLACK WALNUT. 35.5"D X 17.5"H.', 'https://xicteexcnsbtrmvnvcpz.supabase.co/storage/v1/object/public/product-images/SKU359.jpg', 379.05, 30.00, 'lounge', '{lounge,break_room,reception}', 'accessory', NULL, 'per_room'),
  ('SKU360', 'Round Walnut Side Table', 'SOLID AMERICAN BLACK WALNUT. 18.5"H x 19.5".', 'https://xicteexcnsbtrmvnvcpz.supabase.co/storage/v1/object/public/product-images/SKU360.jpg', 189.05, 30.00, 'lounge', '{lounge,break_room,reception}', 'accessory', NULL, 'per_room'),
  ('SKU388', 'Triangle Walnut Coffee Table', 'SOLID AMERICAN BLACK WALNUT. 14"H x 29.5"W x 23"D.', 'https://xicteexcnsbtrmvnvcpz.supabase.co/storage/v1/object/public/product-images/SKU388.jpg', 312.55, 30.00, 'lounge', '{lounge,break_room,reception}', 'accessory', NULL, 'per_room'),
  ('SKU9401779', 'Round Oak Coffee Table', 'TAUPE OAK VENEER. BLACK METAL FRAME. 18"H X 31.5"D.', 'https://xicteexcnsbtrmvnvcpz.supabase.co/storage/v1/object/public/product-images/SKU9401779.jpg', 349.98, 30.00, 'lounge', '{lounge,break_room,reception}', 'accessory', NULL, 'per_room'),
  ('SKY9407227', 'Round Wooden Coffee Table', 'NATURAL WOOD VENEER. LIFT TOP FOR STORAGE. 31.5"D X 18"H.', 'https://xicteexcnsbtrmvnvcpz.supabase.co/storage/v1/object/public/product-images/SKY9407227.jpg', 299.98, 30.00, 'lounge', '{lounge,break_room,reception}', 'accessory', NULL, 'per_room'),

-- Meeting Tables
  ('3696QUO', 'Groupe Lacasse Quorum Rectangular Meeting Table', '36" X 96" LAMINATE TOP WITH 4 METAL ANGLED LEGS. NO POWER. CHOICE OF VENDOR''S STANDARD FINISHES.', 'https://xicteexcnsbtrmvnvcpz.supabase.co/storage/v1/object/public/product-images/3696QUO.jpeg', 839.80, 30.00, 'meeting_table', '{conference_room,training_room}', 'primary', 8, 'per_room'),
  ('42RPC', 'Groupe Lacasse Quorum Round Meeting Table', '42" DIAMETER TOP WITH POWER MODULE. METAL DISC BASE. POWER MODULE INCLUDES 2 OUTLETS, DUAL USB, 1 BLANK. CHOICE OF VENDOR''S STANDARD FINISHES.', 'https://xicteexcnsbtrmvnvcpz.supabase.co/storage/v1/object/public/product-images/42RPC.jpg', 890.83, 30.00, 'meeting_table', '{conference_room,huddle_room}', 'primary', 4, 'per_room'),
  ('48132PC', 'Groupe Lacasse Quorum Rectangular Meeting Table', '48" X 132" LAMINATE TOP. 4 METAL ANGLED LEGS & CENTRAL LAMINATE WIRE MANAGEMENT BASE. 1 POWER MODULE. POWER MODULE INCLUDES 2 OUTLETS, DUAL USB, 1 BLANK. CHOICE OF VENDOR''S STANDARD FINISHES.', 'https://xicteexcnsbtrmvnvcpz.supabase.co/storage/v1/object/public/product-images/48132PC.jpeg', 2054.32, 30.00, 'meeting_table', '{conference_room,training_room}', 'primary', 16, 'per_room'),

-- Office Suite
  ('7272FHA', 'Groupe Lacasse L Shape Office Suite (HA Return)', '72" X 72" FIXED DESK WITH HEIGHT ADJUSTABLE RETURN. MOBILE BOX/BOX/FILE PEDESTAL. CHOICE OF VENDOR''S STANDARD FINISHES.', 'https://xicteexcnsbtrmvnvcpz.supabase.co/storage/v1/object/public/product-images/7272FHA.jpg', 1171.17, 30.00, 'office_suite', '{private_office,executive_office}', 'primary', NULL, 'per_room'),
  ('7272F', 'Groupe Lacasse L Shape Office Suite (Fixed)', '72" X 72" FIXED DESK WITH METAL LEGS AND 3/4 HEIGHT MODESTY. MOBILE METAL BOX/FILE PEDESTAL. CHOICE OF VENDOR''S STANDARD FINISHES.', 'https://xicteexcnsbtrmvnvcpz.supabase.co/storage/v1/object/public/product-images/7272F.jpeg', 670.78, 30.00, 'office_suite', '{private_office,executive_office}', 'primary', NULL, 'per_room'),
  ('7272HA', 'Groupe Lacasse L Shape Office Suite (Full HA)', '72" X 72" HEIGHT ADJUSTABLE DESK & RETURN. MOBILE METAL BOX/FILE PEDESTAL. CHOICE OF VENDOR''S STANDARD FINISHES.', 'https://xicteexcnsbtrmvnvcpz.supabase.co/storage/v1/object/public/product-images/7272HA.jpeg', 1217.48, 30.00, 'office_suite', '{private_office,executive_office}', 'primary', NULL, 'per_room'),

-- Task Seating
  ('11710', 'Haworth Zody Task Chair', 'GAS LIFT, SEAT DEPTH ADJUSTMENT. HEIGHT ADJUSTABLE ARMS. HEIGHT ADJUSTABLE LUMBAR. MESH BACK; UPHOLSTERED SEAT. RENEWED+.', 'https://xicteexcnsbtrmvnvcpz.supabase.co/storage/v1/object/public/product-images/11710.png', 235.00, 30.00, 'task_seating', '{open_workstation,private_office,executive_office}', 'secondary', 1, 'per_workstation'),
  ('11507', 'Herman Miller Mirra 2 Task Chair', 'GAS LIFT, TENSION CONTROL, BACK LOCK, KNEE TILT, LUMBAR ADJUSTMENT, FULLY ADJUSTABLE ARMS, BUTTERFLY SUSPENSION AND TRIFLEX BACK. GRAPHITE. RENEWED+.', 'https://xicteexcnsbtrmvnvcpz.supabase.co/storage/v1/object/public/product-images/11507.jpg', 410.00, 30.00, 'task_seating', '{open_workstation,private_office,executive_office}', 'secondary', 1, 'per_workstation'),
  ('11610', 'Steelcase Leap V2', 'HIGH BACK, GAS LIFT, TENSION CONTROL, BACK LOCK, SEAT DEPTH ADJUSTMENT, LUMBAR ADJUSTMENT, FULLY ADJUSTABLE ARMS. UPHOLSTERED SEAT AND BACK. RENEWED+.', 'https://xicteexcnsbtrmvnvcpz.supabase.co/storage/v1/object/public/product-images/11610.jpg', 405.00, 30.00, 'task_seating', '{open_workstation,private_office,executive_office}', 'secondary', 1, 'per_workstation'),
  ('12444', 'Humanscale Liberty Mesh Back Chair', 'GAS LIFT, SEAT DEPTH ADJUSTMENT. HEIGHT ADJUSTABLE ARMS. MESH BACK; UPHOLSTERED SEAT. RENEWED+.', 'https://xicteexcnsbtrmvnvcpz.supabase.co/storage/v1/object/public/product-images/12444.jpg', 235.00, 30.00, 'task_seating', '{open_workstation,private_office,executive_office}', 'secondary', 1, 'per_workstation'),
  ('73088', 'Allseating Eighty Two Mesh Task Chair', 'BASIC SYNCHRO TILT, TENSION CONTROL, ADJUSTABLE LUMBAR, HEIGHT ADJUSTABLE ARMS. MESH BACK; UPHOLSTERED SEAT. CHOICE OF VENDOR''S STANDARD FINISHES.', 'https://xicteexcnsbtrmvnvcpz.supabase.co/storage/v1/object/public/product-images/73088.jpg', 216.00, 30.00, 'task_seating', '{open_workstation,private_office,executive_office}', 'secondary', 1, 'per_workstation'),

-- Workstations
  ('3060HAT', 'Envirotech Height Adjustable Benching', '29" X 58" HEIGHT ADJUSTABLE TABLE. 24"H CLAMP ON FELT PRIVACY SCREEN. 2 TRIPLEX PER USER. LAMINATE GALLERY GABLE. POWERED VIA HARDWIRED BASE FEED. CHOICE OF VENDOR''S STANDARD FINISHES.', 'https://xicteexcnsbtrmvnvcpz.supabase.co/storage/v1/object/public/product-images/3060HAT.jpeg', 985.00, 30.00, 'workstation', '{open_workstation}', 'primary', NULL, 'per_workstation'),
  ('7272LHA', 'Envirotech L-Shape Workstation', '72" X 72" WORKSTATION. 42"H PANELS, POWERED SPINE WITH 2 TRIPLEX PER USER. LAMINATE GALLERY GABLE. HEIGHT ADJUSTABLE MAIN SURFACE WITH FIXED RETURN. FIXED BOX/BOX/FILE PEDESTAL. POWERED VIA HARDWIRED BASE FEED. CHOICE OF VENDOR''S STANDARD FINISHES.', 'https://xicteexcnsbtrmvnvcpz.supabase.co/storage/v1/object/public/product-images/7272LHA.jpeg', 1340.00, 30.00, 'workstation', '{open_workstation}', 'primary', NULL, 'per_workstation'),
  ('12684', 'Herman Miller Renew Link Benching', 'RENEW LINK HEIGHT ADJUSTABLE BENCHING 28.5" x 59". Plexi Frosted Divider Down Spine 23.5"H x 47.5"L x 6MM. 2 DUPLEX PER STATION. POWERED VIA HARDWIRED BASE FEED. RENEWED.', 'https://xicteexcnsbtrmvnvcpz.supabase.co/storage/v1/object/public/product-images/12684.jpeg', 390.00, 30.00, 'workstation', '{open_workstation}', 'primary', NULL, 'per_workstation')
ON CONFLICT (product_code) DO UPDATE SET
  name = EXCLUDED.name,
  specifications = EXCLUDED.specifications,
  image_url = EXCLUDED.image_url,
  price = EXCLUDED.price,
  markup_percent = EXCLUDED.markup_percent,
  category = EXCLUDED.category,
  space_type = EXCLUDED.space_type,
  product_role = EXCLUDED.product_role,
  capacity = EXCLUDED.capacity,
  quantity_rule = EXCLUDED.quantity_rule;
