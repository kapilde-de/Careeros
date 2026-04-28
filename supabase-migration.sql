-- ============================================================
-- CareerOS Database Upgrade Migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Add new columns to existing resumes table
ALTER TABLE resumes
  ADD COLUMN IF NOT EXISTS rejection_risk integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS human_appeal   integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS salary_min     text,
  ADD COLUMN IF NOT EXISTS salary_max     text;

-- 2. Create user_usage table (efficient monthly usage tracking)
CREATE TABLE IF NOT EXISTS user_usage (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  month      text NOT NULL,  -- format: "YYYY-MM"
  count      integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, month)
);

-- Enable RLS
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own usage" ON user_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own usage" ON user_usage FOR ALL USING (auth.uid() = user_id);

-- 3. Stored procedure to safely increment usage (upsert)
CREATE OR REPLACE FUNCTION increment_usage(p_user_id uuid, p_month text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO user_usage (user_id, month, count, updated_at)
  VALUES (p_user_id, p_month, 1, now())
  ON CONFLICT (user_id, month)
  DO UPDATE SET count = user_usage.count + 1, updated_at = now();
END;
$$;

-- 4. Create resume_versions table (track multiple tailored versions)
CREATE TABLE IF NOT EXISTS resume_versions (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id     uuid REFERENCES resumes(id) ON DELETE CASCADE,
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  version_label text DEFAULT 'v1',
  ats_score     integer DEFAULT 0,
  content       jsonb,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE resume_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own versions" ON resume_versions FOR ALL USING (auth.uid() = user_id);

-- 5. Index for performance
CREATE INDEX IF NOT EXISTS idx_user_usage_user_month ON user_usage(user_id, month);
CREATE INDEX IF NOT EXISTS idx_resume_versions_resume ON resume_versions(resume_id);
CREATE INDEX IF NOT EXISTS idx_resumes_user_created ON resumes(user_id, created_at DESC);

-- Done! ✓
