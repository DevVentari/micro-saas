-- ============================================================
-- Micro-SaaS Monorepo: Supabase Database Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Enable RLS on all tables
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- ============================================================
-- SHARED TABLES
-- ============================================================

-- Users table (synced from Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create user record on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  app TEXT NOT NULL CHECK (app IN ('invoicely', 'metatagz', 'palettai')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, app)
);

-- ============================================================
-- INVOICELY-SPECIFIC TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  data JSONB NOT NULL,  -- Full InvoiceData object
  invoice_number TEXT,
  client_name TEXT,
  total_amount NUMERIC,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'unpaid', 'paid')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  address JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- METATAGZ-SPECIFIC TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS meta_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  results JSONB NOT NULL,  -- MetaResult object
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PALETTAI-SPECIFIC TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS palettes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT,
  prompt TEXT,
  colors JSONB NOT NULL,  -- Array of { hex, name, role }
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE palettes ENABLE ROW LEVEL SECURITY;

-- Users: can only read/update their own row
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Subscriptions: users see only their own
CREATE POLICY "Users see own subscriptions" ON subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- Service role bypass (for webhook updates)
CREATE POLICY "Service role full access subscriptions" ON subscriptions
  FOR ALL TO service_role USING (true);

-- Invoices: users manage their own
CREATE POLICY "Users manage own invoices" ON invoices
  FOR ALL USING (auth.uid() = user_id);

-- Clients: users manage their own
CREATE POLICY "Users manage own clients" ON clients
  FOR ALL USING (auth.uid() = user_id);

-- Meta checks: users manage their own
CREATE POLICY "Users manage own meta_checks" ON meta_checks
  FOR ALL USING (auth.uid() = user_id);

-- Palettes: users manage their own
CREATE POLICY "Users manage own palettes" ON palettes
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_app ON subscriptions(user_id, app);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meta_checks_user_id ON meta_checks(user_id);
CREATE INDEX IF NOT EXISTS idx_palettes_user_id ON palettes(user_id);
CREATE INDEX IF NOT EXISTS idx_palettes_created_at ON palettes(created_at DESC);
