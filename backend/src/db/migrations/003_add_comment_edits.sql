-- Migration: Add comment edit history
-- Version: 003

DO $$
BEGIN
  -- Create comment_edits table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comment_edits') THEN
    CREATE TABLE comment_edits (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
      original_content TEXT NOT NULL,
      edited_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
      edited_at TIMESTAMP DEFAULT NOW(),
      reason TEXT
    );

    -- Create indexes for performance
    CREATE INDEX idx_comment_edits_comment_id ON comment_edits(comment_id);
    CREATE INDEX idx_comment_edits_edited_at ON comment_edits(edited_at DESC);
  END IF;

  -- Add updated_at and edit_count columns to comments if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comments' AND column_name = 'updated_at') THEN
    ALTER TABLE comments ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comments' AND column_name = 'edit_count') THEN
    ALTER TABLE comments ADD COLUMN edit_count INT DEFAULT 0;
  END IF;

END $$;
