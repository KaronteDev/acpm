-- Migration: Add user preferences
-- Version: 004

DO $$
BEGIN
  -- Add preferences column to users if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'theme_preference') THEN
    ALTER TABLE users ADD COLUMN theme_preference VARCHAR DEFAULT 'light' CHECK (theme_preference IN ('light', 'high_contrast', 'colorblind', 'dark'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'text_to_speech_enabled') THEN
    ALTER TABLE users ADD COLUMN text_to_speech_enabled BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'tts_voice' ) THEN
    ALTER TABLE users ADD COLUMN tts_voice VARCHAR DEFAULT 'default';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'tts_rate') THEN
    ALTER TABLE users ADD COLUMN tts_rate DECIMAL(3,2) DEFAULT 1.0 CHECK (tts_rate >= 0.5 AND tts_rate <= 2.0);
  END IF;

END $$;
