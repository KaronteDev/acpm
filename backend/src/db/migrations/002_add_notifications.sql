-- Crear enum para notification_type si no existe
DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'mention',
    'comment_reply',
    'task_assigned',
    'task_completed'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Crear tabla notifications
CREATE TABLE IF NOT EXISTS notifications (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type notification_type NOT NULL,
  related_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  comment_id    UUID REFERENCES comments(id) ON DELETE CASCADE,
  task_id       UUID REFERENCES tasks(id) ON DELETE CASCADE,
  message       TEXT NOT NULL,
  is_read       BOOLEAN NOT NULL DEFAULT FALSE,
  read_at       TIMESTAMP WITH TIME ZONE,
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);
