-- Migration: Update theme_preference check constraint to include 'dark'
-- Version: 005

DO $$
BEGIN
  -- Drop the old constraint if it exists
  ALTER TABLE users DROP CONSTRAINT IF EXISTS users_theme_preference_check;
  
  -- Add the new constraint with all 4 theme options
  ALTER TABLE users ADD CONSTRAINT users_theme_preference_check 
    CHECK (theme_preference IN ('light', 'high_contrast', 'colorblind', 'dark'));
    
EXCEPTION
  WHEN OTHERS THEN
    -- If columns don't exist yet, silently continue
    -- The 004 migration will handle column creation
    NULL;
END $$;
