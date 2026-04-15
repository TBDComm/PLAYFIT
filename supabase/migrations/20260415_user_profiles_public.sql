-- SQ-11: Add public profile columns to user_profiles
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS bio         TEXT,
  ADD COLUMN IF NOT EXISTS is_public   BOOLEAN NOT NULL DEFAULT FALSE;
