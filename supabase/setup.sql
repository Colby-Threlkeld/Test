-- Run this in your Supabase SQL editor: https://supabase.com/dashboard/project/paepymfqyblhdtniiulj/sql

-- Enable pgcrypto for hashing the demo user's password
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users table (separate from Supabase Auth — used with NextAuth credentials)
CREATE TABLE IF NOT EXISTS public.users (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  name        text        NOT NULL,
  email       text        NOT NULL UNIQUE,
  password_hash text      NOT NULL,
  avatar_url  text,
  nationality text        DEFAULT 'US',
  created_at  timestamptz DEFAULT now()
);

-- Disable RLS so the anon key can read/write (MVP only — add policies before production)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Grant anon role access (needed for Next.js API routes using the anon key)
GRANT SELECT, INSERT ON public.users TO anon;
GRANT SELECT, INSERT ON public.users TO authenticated;

-- Seed a demo user (password: "demo")
INSERT INTO public.users (name, email, password_hash, avatar_url, nationality)
VALUES (
  'Demo User',
  'demo@fanzone.app',
  crypt('demo', gen_salt('bf', 10)),
  'https://api.dicebear.com/9.x/avataaars/svg?seed=demo',
  'US'
) ON CONFLICT (email) DO NOTHING;
