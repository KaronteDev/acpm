-- ============================================================
-- Migration: Add display_order to tasks table
-- Description: Adds support for persistent task ordering within sprints
-- Created: 2026-03-31
-- ============================================================

-- Add display_order column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Create index for efficient ordering queries
CREATE INDEX IF NOT EXISTS idx_tasks_sprint_order ON tasks(sprint_id, display_order) 
WHERE sprint_id IS NOT NULL;

-- Initialize existing tasks with display_order based on creation time
-- Tasks in the same sprint are ordered by creation time
UPDATE tasks 
SET display_order = (
  SELECT ROW_NUMBER() OVER (PARTITION BY t.sprint_id ORDER BY t.created_at ASC) - 1
  FROM tasks t
  WHERE t.id = tasks.id
)
WHERE sprint_id IS NOT NULL AND display_order = 0;

-- Comment on the new column
COMMENT ON COLUMN tasks.display_order IS 'Display order of task within its sprint. Used for custom task ordering.';
