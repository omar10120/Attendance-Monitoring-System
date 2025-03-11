-- Create admin user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role
) VALUES (
  'admin-user-id',
  '00000000-0000-0000-0000-000000000000',
  'admin@domain.com',
  crypt('Aa@123456', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Create admin profile
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
) VALUES (
  'admin-user-id',
  'admin@domain.com',
  'System Administrator',
  'ADMIN',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;
