-- Migration: Add font size preference
-- Version: 006

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'font_size_preference') THEN
    ALTER TABLE users ADD COLUMN font_size_preference VARCHAR DEFAULT 'normal' CHECK (font_size_preference IN ('small', 'normal', 'large', 'extra_large'));
  END IF;
END $$;
