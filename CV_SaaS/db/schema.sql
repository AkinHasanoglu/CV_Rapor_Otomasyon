-- ============================================================
-- CV & Resume Generator SaaS — PostgreSQL Şeması
-- Neon / Supabase / Vercel Postgres gibi serverless PostgreSQL
-- sağlayıcılarında çalıştırın.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Kullanıcılar (Bireysel + Kurumsal aynı tabloda, role ile ayrıştırılır)
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  full_name       TEXT NOT NULL DEFAULT '',
  role            TEXT NOT NULL DEFAULT 'b2c' CHECK (role IN ('b2c', 'b2b')),
  plan            TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'individual', 'business')),
  subscription_status    TEXT NOT NULL DEFAULT 'inactive' CHECK (subscription_status IN ('inactive', 'trialing', 'active', 'past_due', 'canceled')),
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  subscription_period_end TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- B2C: Belge Geçmişi (oluşturulan CV'ler)
CREATE TABLE IF NOT EXISTS documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL DEFAULT 'İsimsiz CV',
  source      TEXT NOT NULL DEFAULT 'form' CHECK (source IN ('draft', 'form')),
  input_summary JSONB,
  cv_data     JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Sürüm geçmişi: her kayıtta önceki CV anlık görüntüleri
ALTER TABLE documents ADD COLUMN IF NOT EXISTS versions JSONB NOT NULL DEFAULT '[]'::jsonb;
CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id, created_at DESC);

-- B2B: Toplu İş Kuyrukları
CREATE TABLE IF NOT EXISTS jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  output_type     TEXT NOT NULL CHECK (output_type IN ('professional', 'resume', 'project')),
  total_rows      INT NOT NULL DEFAULT 0,
  processed_rows  INT NOT NULL DEFAULT 0,
  failed_rows     INT NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'partial', 'failed')),
  error           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_jobs_user ON jobs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status) WHERE status IN ('queued', 'processing');

-- B2B: İş Satırları (her aday = bir satır)
CREATE TABLE IF NOT EXISTS job_rows (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id      UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  row_index   INT NOT NULL,
  candidate_name TEXT NOT NULL DEFAULT '',
  data        JSONB NOT NULL,
  status      TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  error       TEXT,
  output      JSONB,            -- üretilen CV verisi
  filename    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_job_rows_job ON job_rows(job_id, status);
