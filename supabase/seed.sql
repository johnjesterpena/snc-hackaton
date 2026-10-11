-- Fictional demo data for SNC SmartResto. Do not use real customer records.
-- Demo password for all seed accounts: Demo1234!

create extension if not exists pgcrypto;

-- Seed staff (trigger creates profiles from raw_user_meta_data)
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) values
(
  '00000000-0000-0000-0000-000000000000',
  'a1111111-1111-1111-1111-111111111111',
  'authenticated',
  'authenticated',
  'admin@snc.local',
  crypt('Demo1234!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name":"SNC Admin","role":"admin"}'::jsonb,
  now(),
  now(),
  '',
  '',
  '',
  ''
),
(
  '00000000-0000-0000-0000-000000000000',
  'a2222222-2222-2222-2222-222222222222',
  'authenticated',
  'authenticated',
  'cashier@snc.local',
  crypt('Demo1234!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name":"Front Desk","role":"cashier"}'::jsonb,
  now(),
  now(),
  '',
  '',
  '',
  ''
),
(
  '00000000-0000-0000-0000-000000000000',
  'a3333333-3333-3333-3333-333333333333',
  'authenticated',
  'authenticated',
  'kitchen@snc.local',
  crypt('Demo1234!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name":"Kitchen Staff","role":"kitchen"}'::jsonb,
  now(),
  now(),
  '',
  '',
  '',
  ''
)
on conflict (id) do nothing;

insert into auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) values
(
  gen_random_uuid(),
  'a1111111-1111-1111-1111-111111111111',
  '{"sub":"a1111111-1111-1111-1111-111111111111","email":"admin@snc.local"}'::jsonb,
  'email',
  'a1111111-1111-1111-1111-111111111111',
  now(),
  now(),
  now()
),
(
  gen_random_uuid(),
  'a2222222-2222-2222-2222-222222222222',
  '{"sub":"a2222222-2222-2222-2222-222222222222","email":"cashier@snc.local"}'::jsonb,
  'email',
  'a2222222-2222-2222-2222-222222222222',
  now(),
  now(),
  now()
),
(
  gen_random_uuid(),
  'a3333333-3333-3333-3333-333333333333',
  '{"sub":"a3333333-3333-3333-3333-333333333333","email":"kitchen@snc.local"}'::jsonb,
  'email',
  'a3333333-3333-3333-3333-333333333333',
  now(),
  now(),
  now()
)
on conflict do nothing;

insert into public.categories (id, name) values
  ('c1111111-1111-1111-1111-111111111111', 'Coffee & Drinks'),
  ('c2222222-2222-2222-2222-222222222222', 'Silog Meals'),
  ('c3333333-3333-3333-3333-333333333333', 'Merienda'),
  ('c4444444-4444-4444-4444-444444444444', 'Rice Meals')
on conflict (name) do nothing;

insert into public.menu_items (category_id, name, description, price, is_available, estimated_prep_minutes) values
  ('c1111111-1111-1111-1111-111111111111', 'Barako Brew', 'Hot local barako coffee', 80.00, true, 5),
  ('c1111111-1111-1111-1111-111111111111', 'Iced Latte', 'Espresso over ice with milk', 120.00, true, 6),
  ('c1111111-1111-1111-1111-111111111111', 'Calamansi Juice', 'Fresh calamansi cooler', 70.00, true, 4),
  ('c2222222-2222-2222-2222-222222222222', 'Tapsilog', 'Beef tapa, garlic rice, egg', 165.00, true, 18),
  ('c2222222-2222-2222-2222-222222222222', 'Longsilog', 'Longganisa, garlic rice, egg', 150.00, true, 16),
  ('c2222222-2222-2222-2222-222222222222', 'Bangsilog', 'Fried bangus, garlic rice, egg', 175.00, true, 20),
  ('c3333333-3333-3333-3333-333333333333', 'Turon', 'Banana lumpia with caramel', 60.00, true, 10),
  ('c3333333-3333-3333-3333-333333333333', 'Pancit Canton', 'Stir-fried noodles', 130.00, true, 14),
  ('c4444444-4444-4444-4444-444444444444', 'Chicken Inasal', 'Grilled chicken with rice', 185.00, true, 22),
  ('c4444444-4444-4444-4444-444444444444', 'Pork Sisig', 'Sizzling sisig with rice', 190.00, true, 18),
  ('c4444444-4444-4444-4444-444444444444', 'Vegetarian Lumpia', 'Fresh vegetable rolls', 90.00, false, 12);

insert into public.dining_tables (table_number, capacity, status) values
  ('1', 2, 'available'),
  ('2', 2, 'available'),
  ('3', 4, 'available'),
  ('4', 4, 'available'),
  ('5', 4, 'available'),
  ('6', 6, 'available'),
  ('7', 6, 'available'),
  ('8', 4, 'available'),
  ('9', 2, 'available'),
  ('10', 8, 'available');
