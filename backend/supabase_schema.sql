-- Run this once in your Supabase SQL Editor
-- Go to: https://supabase.com/dashboard → your project → SQL Editor → New Query

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL DEFAULT '',
    first_name TEXT NOT NULL DEFAULT '',
    last_name TEXT NOT NULL DEFAULT '',
    phone TEXT DEFAULT '',
    date_of_birth DATE,
    gender TEXT,
    skin_type TEXT,
    primary_concern TEXT,
    skin_tone TEXT,
    known_allergies TEXT[] DEFAULT '{}',
    oauth_provider TEXT,
    oauth_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    token_hash TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    invalidated BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    category TEXT NOT NULL,
    ingredients TEXT[] NOT NULL DEFAULT '{}',
    target_skin_types TEXT[] NOT NULL DEFAULT '{}',
    target_conditions TEXT[] NOT NULL DEFAULT '{}',
    image_url TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    image_url TEXT DEFAULT '',
    skin_type TEXT NOT NULL,
    skin_type_confidence FLOAT NOT NULL DEFAULT 0,
    low_confidence_flag BOOLEAN DEFAULT FALSE,
    conditions JSONB DEFAULT '[]',
    face_regions JSONB DEFAULT '{}',
    recommendations JSONB DEFAULT '[]',
    report_url TEXT
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_analyses_user ON analyses(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Disable RLS for service role access (backend uses service key)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE analyses DISABLE ROW LEVEL SECURITY;
