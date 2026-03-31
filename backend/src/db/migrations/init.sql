-- ============================================================
-- ACPM — Altas Capacidades Project Manager
-- Database Schema v1.0.0
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM (
  'admin',
  'architect_lead',
  'deep_contributor',
  'connector',
  'flow_guardian',
  'product_visionary',
  'devops_integrator',
  'quality_auditor',
  'stakeholder'
);

CREATE TYPE project_type AS ENUM (
  'exploration',
  'delivery',
  'research',
  'maintenance',
  'innovation'
);

CREATE TYPE project_methodology AS ENUM (
  'kanban_aacc',
  'adaptive_sprint',
  'async_deep',
  'hybrid'
);

CREATE TYPE project_status AS ENUM (
  'draft',
  'active',
  'paused',
  'completed',
  'archived'
);

CREATE TYPE task_type AS ENUM (
  'implementation',
  'research',
  'spike',
  'review',
  'experiment',
  'documentation',
  'bug',
  'refactor'
);

CREATE TYPE cognitive_type AS ENUM (
  'deep_focus',
  'creative',
  'routine',
  'collaborative',
  'exploratory'
);

CREATE TYPE task_status AS ENUM (
  'backlog',
  'todo',
  'in_progress',
  'review',
  'blocked',
  'done',
  'cancelled'
);

CREATE TYPE task_priority AS ENUM (
  'critical',
  'high',
  'medium',
  'low',
  'someday'
);

CREATE TYPE sprint_status AS ENUM (
  'planning',
  'active',
  'review',
  'completed'
);

CREATE TYPE alert_type AS ENUM (
  'overload',
  'hyperfocus',
  'perfectionism_block',
  'missing_context',
  'consecutive_routine',
  'burnout_risk'
);

CREATE TYPE alert_severity AS ENUM (
  'info',
  'warning',
  'critical'
);

CREATE TYPE notification_type AS ENUM (
  'mention',
  'comment_reply',
  'task_assigned',
  'task_completed'
);

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email             VARCHAR(255) UNIQUE NOT NULL,
  full_name         VARCHAR(200) NOT NULL,
  password_hash     VARCHAR(255) NOT NULL,
  avatar_url        TEXT,
  role              user_role NOT NULL DEFAULT 'deep_contributor',
  cognitive_profile JSONB NOT NULL DEFAULT '{}',
  aacc_indicators   JSONB,
  timezone          VARCHAR(50) NOT NULL DEFAULT 'Europe/Madrid',
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_seen_at      TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- --------------------------------------------------------

CREATE TABLE projects (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                 VARCHAR(200) NOT NULL,
  description          TEXT,
  project_type         project_type NOT NULL DEFAULT 'delivery',
  methodology          project_methodology NOT NULL DEFAULT 'kanban_aacc',
  status               project_status NOT NULL DEFAULT 'draft',
  cognitive_complexity INTEGER NOT NULL DEFAULT 5 CHECK (cognitive_complexity BETWEEN 1 AND 10),
  start_date           DATE,
  target_date          DATE,
  owner_id             UUID REFERENCES users(id) ON DELETE SET NULL,
  settings             JSONB NOT NULL DEFAULT '{}',
  tags                 TEXT[] DEFAULT '{}',
  created_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_tags ON projects USING gin(tags);

-- --------------------------------------------------------

CREATE TABLE project_members (
  project_id    UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  role          user_role NOT NULL,
  joined_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

CREATE INDEX idx_project_members_user ON project_members(user_id);

-- --------------------------------------------------------

CREATE TABLE sprints (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id             UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name                   VARCHAR(200) NOT NULL,
  goal                   TEXT NOT NULL DEFAULT '',
  start_date             DATE NOT NULL,
  end_date               DATE NOT NULL,
  status                 sprint_status NOT NULL DEFAULT 'planning',
  total_cognitive_points INTEGER,
  team_capacity          JSONB NOT NULL DEFAULT '{}',
  retrospective          JSONB,
  created_at             TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sprints_project ON sprints(project_id);
CREATE INDEX idx_sprints_status ON sprints(status);

-- --------------------------------------------------------

CREATE TABLE tasks (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id         UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_task_id     UUID REFERENCES tasks(id) ON DELETE CASCADE,
  sprint_id          UUID REFERENCES sprints(id) ON DELETE SET NULL,
  title              VARCHAR(400) NOT NULL,
  description        TEXT,
  task_type          task_type NOT NULL DEFAULT 'implementation',
  cognitive_type     cognitive_type NOT NULL DEFAULT 'deep_focus',
  status             task_status NOT NULL DEFAULT 'backlog',
  priority           task_priority NOT NULL DEFAULT 'medium',
  cognitive_points   INTEGER NOT NULL DEFAULT 3 CHECK (cognitive_points IN (1,2,3,5,8,13,21)),
  estimated_hours    DECIMAL(5,2),
  actual_hours       DECIMAL(5,2),
  assignee_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  strategic_context  TEXT,
  definition_of_done JSONB NOT NULL DEFAULT '[]',
  dependencies       UUID[] DEFAULT '{}',
  tags               TEXT[] DEFAULT '{}',
  blocked_reason     TEXT,
  created_by         UUID NOT NULL REFERENCES users(id),
  created_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_sprint ON tasks(sprint_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_cognitive_type ON tasks(cognitive_type);
CREATE INDEX idx_tasks_tags ON tasks USING gin(tags);
CREATE INDEX idx_tasks_title_search ON tasks USING gin(to_tsvector('spanish', title));

-- --------------------------------------------------------

CREATE TABLE cognitive_sessions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id             UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  started_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ended_at            TIMESTAMP WITH TIME ZONE,
  energy_level_start  INTEGER NOT NULL CHECK (energy_level_start BETWEEN 1 AND 5),
  energy_level_end    INTEGER CHECK (energy_level_end BETWEEN 1 AND 5),
  flow_mode           BOOLEAN NOT NULL DEFAULT FALSE,
  interruptions_count INTEGER NOT NULL DEFAULT 0,
  quality_rating      INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
  notes               TEXT
);

CREATE INDEX idx_sessions_user ON cognitive_sessions(user_id);
CREATE INDEX idx_sessions_task ON cognitive_sessions(task_id);
CREATE INDEX idx_sessions_started ON cognitive_sessions(started_at);

-- --------------------------------------------------------

CREATE TABLE comments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id     UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  is_thinking BOOLEAN NOT NULL DEFAULT FALSE, -- "Pensamiento en voz alta"
  parent_id   UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_task ON comments(task_id);

-- --------------------------------------------------------

CREATE TABLE notifications (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type notification_type NOT NULL,
  related_user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- quien hizo la acción (quien te mencionó, etc)
  comment_id    UUID REFERENCES comments(id) ON DELETE CASCADE,
  task_id       UUID REFERENCES tasks(id) ON DELETE CASCADE,
  message       TEXT NOT NULL,
  is_read       BOOLEAN NOT NULL DEFAULT FALSE,
  read_at       TIMESTAMP WITH TIME ZONE,
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- --------------------------------------------------------

CREATE TABLE cognitive_alerts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id   UUID REFERENCES projects(id) ON DELETE CASCADE,
  alert_type   alert_type NOT NULL,
  severity     alert_severity NOT NULL DEFAULT 'warning',
  message      TEXT NOT NULL,
  metadata     JSONB DEFAULT '{}',
  resolved     BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at  TIMESTAMP WITH TIME ZONE,
  resolved_by  UUID REFERENCES users(id),
  created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alerts_user ON cognitive_alerts(user_id);
CREATE INDEX idx_alerts_resolved ON cognitive_alerts(resolved);

-- --------------------------------------------------------

CREATE TABLE knowledge_nodes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title       VARCHAR(400) NOT NULL,
  content     TEXT NOT NULL,
  node_type   VARCHAR(50) NOT NULL DEFAULT 'lesson', -- 'adr', 'lesson', 'pattern', 'decision'
  author_id   UUID REFERENCES users(id),
  tags        TEXT[] DEFAULT '{}',
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_knowledge_project ON knowledge_nodes(project_id);
CREATE INDEX idx_knowledge_search ON knowledge_nodes USING gin(to_tsvector('spanish', title || ' ' || content));

-- --------------------------------------------------------

CREATE TABLE audit_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id),
  entity_type VARCHAR(50) NOT NULL,
  entity_id   UUID NOT NULL,
  action      VARCHAR(50) NOT NULL,
  old_value   JSONB,
  new_value   JSONB,
  ip_address  INET,
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_log(created_at);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER knowledge_updated_at BEFORE UPDATE ON knowledge_nodes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SEED DATA — Demo project and users
-- ============================================================

-- Demo users (passwords = "acpm2026")
INSERT INTO users (id, email, full_name, password_hash, role, cognitive_profile, timezone) VALUES
  ('11111111-0000-0000-0000-000000000001', 'elena@acpm.dev', 'Elena García', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'architect_lead',
   '{"chronotype":"morning","preferred_tasks":["deep_focus","creative"],"tolerance_ambiguity":7,"overload_threshold":8,"min_focus_block":90}', 'Europe/Madrid'),
  ('11111111-0000-0000-0000-000000000002', 'marc@acpm.dev', 'Marc Vidal', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'deep_contributor',
   '{"chronotype":"afternoon","preferred_tasks":["deep_focus","exploratory"],"tolerance_ambiguity":6,"overload_threshold":7,"min_focus_block":120}', 'Europe/Madrid'),
  ('11111111-0000-0000-0000-000000000003', 'sara@acpm.dev', 'Sara Roca', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'connector',
   '{"chronotype":"morning","preferred_tasks":["collaborative","creative"],"tolerance_ambiguity":8,"overload_threshold":6,"min_focus_block":60}', 'Europe/Madrid'),
  ('11111111-0000-0000-0000-000000000004', 'pau@acpm.dev', 'Pau López', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'flow_guardian',
   '{"chronotype":"evening","preferred_tasks":["routine","collaborative"],"tolerance_ambiguity":5,"overload_threshold":5,"min_focus_block":45}', 'Europe/Madrid'),
  ('11111111-0000-0000-0000-000000000005', 'ana@acpm.dev', 'Ana Torres', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'devops_integrator',
   '{"chronotype":"morning","preferred_tasks":["routine","deep_focus"],"tolerance_ambiguity":4,"overload_threshold":7,"min_focus_block":60}', 'Europe/Madrid');

-- Demo project
INSERT INTO projects (id, name, description, project_type, methodology, status, cognitive_complexity, owner_id, tags) VALUES
  ('22222222-0000-0000-0000-000000000001', 'Motor de IA Cognitiva', 'Desarrollo del núcleo de inteligencia cognitiva de ACPM: detección de hiperfoco, cálculo de ICC y optimización de asignaciones.', 'innovation', 'adaptive_sprint', 'active', 9, '11111111-0000-0000-0000-000000000001', ARRAY['AI','Core','Python','PostgreSQL']),
  ('22222222-0000-0000-0000-000000000002', 'Refactor Core Engine', 'Refactorización del motor central para mejorar rendimiento y mantenibilidad. Reducción de deuda técnica acumulada.', 'maintenance', 'kanban_aacc', 'active', 6, '11111111-0000-0000-0000-000000000001', ARRAY['Refactor','Node.js','TypeScript']),
  ('22222222-0000-0000-0000-000000000003', 'API Gateway v3', 'Nueva versión del API Gateway con soporte para autenticación avanzada, rate limiting cognitivo y documentación OpenAPI 3.0.', 'delivery', 'adaptive_sprint', 'active', 7, '11111111-0000-0000-0000-000000000002', ARRAY['API','REST','Security']),
  ('22222222-0000-0000-0000-000000000004', 'Investigación Neuroadaptativa', 'Exploración de patrones neuroadaptativos en equipos AACC: cronotipos, ritmos circadianos y optimización de flujo colectivo.', 'research', 'async_deep', 'active', 8, '11111111-0000-0000-0000-000000000003', ARRAY['Research','AACC','Psychology']);

-- Project members
INSERT INTO project_members (project_id, user_id, role) VALUES
  ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'architect_lead'),
  ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002', 'deep_contributor'),
  ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000003', 'connector'),
  ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000004', 'flow_guardian'),
  ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000005', 'devops_integrator'),
  ('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', 'architect_lead'),
  ('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002', 'deep_contributor'),
  ('22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000002', 'architect_lead'),
  ('22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000005', 'devops_integrator'),
  ('22222222-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000003', 'connector'),
  ('22222222-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000002', 'deep_contributor');

-- Sprint
INSERT INTO sprints (id, project_id, name, goal, start_date, end_date, status, total_cognitive_points, team_capacity) VALUES
  ('33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'Sprint #4', 'Completar el algoritmo de detección de hiperfoco v2 y el dashboard ICC en tiempo real', '2026-03-10', '2026-03-24', 'active', 34,
   '{"11111111-0000-0000-0000-000000000001":{"available_pcc":21,"current_load":13},"11111111-0000-0000-0000-000000000002":{"available_pcc":18,"current_load":8}}'),
  ('33333333-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000002', 'Sprint #2', 'Migración de perfiles cognitivos a JSONB con índices GIN', '2026-03-03', '2026-03-17', 'active', 18, '{}');

-- Tasks
INSERT INTO tasks (id, project_id, sprint_id, title, description, task_type, cognitive_type, status, priority, cognitive_points, assignee_id, strategic_context, definition_of_done, tags, created_by) VALUES
  ('44444444-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001',
   'Diseñar algoritmo de detección de hiperfoco usando señales de inactividad del teclado',
   'El algoritmo debe procesar señales del entorno: inactividad de teclado >30s, ventana activa sin cambios >15min, ausencia de eventos de comunicación. Modelo de ventana deslizante de 20min.',
   'implementation', 'deep_focus', 'in_progress', 'high', 13, '11111111-0000-0000-0000-000000000001',
   'Este algoritmo es el núcleo del Hyperfocus Shield. Sin él, el sistema no puede detectar automáticamente cuándo proteger el tiempo de flujo profundo. Impacto directo en el KPI de % de tiempo en flujo del equipo.',
   '[{"text":"Algoritmo implementado y testeado con datos históricos","done":true},{"text":"Precisión de detección ≥ 85% comparado con auto-declaración","done":true},{"text":"Latencia de detección < 500ms","done":false},{"text":"Integración con módulo de notificaciones validada","done":false},{"text":"Documentación técnica en knowledge base","done":false}]',
   ARRAY['AI','Python','Algorithms'], '11111111-0000-0000-0000-000000000001'),

  ('44444444-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001',
   'Dashboard ICC en tiempo real con WebSockets',
   'Implementar dashboard que muestre el Índice de Carga Cognitiva en tiempo real usando Socket.io y Redis pub/sub.',
   'implementation', 'deep_focus', 'in_progress', 'high', 8, '11111111-0000-0000-0000-000000000002',
   'El dashboard ICC es la pantalla principal del Flow Guardian. Permite detectar sobrecarga cognitiva antes de que impacte la productividad del equipo.',
   '[{"text":"WebSocket handler implementado","done":true},{"text":"Actualización en tiempo real < 2s","done":false},{"text":"Responsive en móvil","done":false}]',
   ARRAY['WebSockets','Redis','Dashboard'], '11111111-0000-0000-0000-000000000001'),

  ('44444444-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000001', NULL,
   'Spike: evaluar embeddings semánticos para clasificación Brain Dump',
   'Investigar y comparar OpenAI embeddings vs modelos open-source (all-MiniLM, nomic-embed) para clasificar automáticamente las entradas del Brain Dump en categorías cognitivas.',
   'spike', 'creative', 'todo', 'medium', 8, '11111111-0000-0000-0000-000000000002', NULL,
   '[{"text":"Benchmarks completados con dataset de prueba","done":false},{"text":"Recomendación documentada con justificación técnica","done":false}]',
   ARRAY['AI','Embeddings','Research'], '11111111-0000-0000-0000-000000000001'),

  ('44444444-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001',
   'Módulo de cálculo del ICC (Índice Carga Cognitiva)',
   'Implementar el motor de cálculo del ICC considerando PCC asignados, sesiones activas, interrupciones y tendencia de energía declarada.',
   'implementation', 'deep_focus', 'review', 'critical', 8, '11111111-0000-0000-0000-000000000001',
   'El ICC es la métrica central de bienestar del sistema ACPM. Su correcta implementación determina la fiabilidad de todas las alertas de sobrecarga.',
   '[{"text":"Fórmula ICC validada con equipo","done":true},{"text":"Tests unitarios >90% cobertura","done":true},{"text":"Performance < 50ms por cálculo","done":false}]',
   ARRAY['Core','Algorithms'], '11111111-0000-0000-0000-000000000001'),

  ('44444444-0000-0000-0000-000000000005', '22222222-0000-0000-0000-000000000001', NULL,
   'Integración Figma plugin — pendiente OAuth aprobación',
   'Conectar el visor de diseños de Figma al detalle de tarea. Bloqueado esperando aprobación del OAuth app en el portal de Figma.',
   'implementation', 'collaborative', 'blocked', 'medium', 3, '11111111-0000-0000-0000-000000000003',
   NULL,
   '[{"text":"OAuth app aprobada","done":false},{"text":"Preview inline funcionando","done":false}]',
   ARRAY['Figma','Integration'], '11111111-0000-0000-0000-000000000001'),

  ('44444444-0000-0000-0000-000000000006', '22222222-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001',
   'Schema inicial de tablas cognitive_sessions',
   'Diseño e implementación de la tabla cognitive_sessions con todos los campos definidos en el análisis funcional.',
   'implementation', 'routine', 'done', 'high', 3, '11111111-0000-0000-0000-000000000001', NULL,
   '[{"text":"Schema definido y migración creada","done":true},{"text":"Índices optimizados para queries frecuentes","done":true}]',
   ARRAY['PostgreSQL','DB'], '11111111-0000-0000-0000-000000000001'),

  ('44444444-0000-0000-0000-000000000007', '22222222-0000-0000-0000-000000000001', NULL,
   'Explorar modelo de predicción de bloqueo creativo con LLM',
   NULL, 'spike', 'exploratory', 'backlog', 'someday', 5, NULL, NULL,
   '[]', ARRAY['AI','Research'], '11111111-0000-0000-0000-000000000002'),

  ('44444444-0000-0000-0000-000000000008', '22222222-0000-0000-0000-000000000001', NULL,
   'Actualizar documentación API de sesiones cognitivas',
   'Documentar todos los endpoints de cognitive_sessions en OpenAPI 3.0 con ejemplos de request/response.',
   'documentation', 'routine', 'todo', 'low', 2, '11111111-0000-0000-0000-000000000005', NULL,
   '[{"text":"Todos los endpoints documentados en OpenAPI","done":false}]',
   ARRAY['Documentation','API'], '11111111-0000-0000-0000-000000000001');

-- Cognitive sessions
INSERT INTO cognitive_sessions (user_id, task_id, started_at, ended_at, energy_level_start, energy_level_end, flow_mode, interruptions_count, quality_rating) VALUES
  ('11111111-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000001', NOW() - INTERVAL '1 day 3 hours', NOW() - INTERVAL '1 day 30 minutes', 4, 3, TRUE, 0, 4),
  ('11111111-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000001', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '47 minutes', 5, 4, TRUE, 1, 4),
  ('11111111-0000-0000-0000-000000000002', '44444444-0000-0000-0000-000000000002', NOW() - INTERVAL '2 hours', NULL, 3, NULL, FALSE, 2, NULL);

-- Cognitive alerts
INSERT INTO cognitive_alerts (user_id, project_id, alert_type, severity, message, metadata) VALUES
  ('11111111-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000001', 'overload', 'critical', 'Pau López ha superado el umbral de carga cognitiva durante 3 días consecutivos. ICC: 8.7/10', '{"icc":8.7,"days_overload":3}'),
  ('11111111-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000001', 'hyperfocus', 'warning', 'Marc Vidal lleva 4h 23min en sesión de flujo profundo sin pausa registrada.', '{"session_duration_minutes":263}');

-- Knowledge nodes
INSERT INTO knowledge_nodes (project_id, title, content, node_type, author_id, tags) VALUES
  ('22222222-0000-0000-0000-000000000001', 'ADR-001: Elección de ventana deslizante para detección de hiperfoco', 'Se evalúan tres enfoques para detectar el estado de hiperfoco: (1) ventana fija de 20min, (2) ventana adaptativa según perfil, (3) modelo ML. Se decide comenzar con ventana deslizante de 20min configurable porque minimiza complejidad inicial y permite validar la hipótesis con datos reales antes de invertir en ML.', 'adr', '11111111-0000-0000-0000-000000000001', ARRAY['architecture','hyperfocus','decision']),
  ('22222222-0000-0000-0000-000000000001', 'Patrón: Cálculo de ICC Compuesto', 'El ICC se calcula como promedio ponderado: (PCC_asignados * 0.4) + (sesiones_activas_horas * 0.3) + (interrupciones_ratio * 0.2) + (energia_inversa * 0.1). Este patrón permite escalar cada componente independientemente en futuras versiones.', 'pattern', '11111111-0000-0000-0000-000000000001', ARRAY['algorithm','icc','pattern']);

-- Comments
INSERT INTO comments (task_id, author_id, content, is_thinking) VALUES
  ('44444444-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002', 'He encontrado un paper interesante sobre detección de estados cognitivos con señales de inactividad. La clave parece ser combinar la inactividad de I/O con el patrón de cambio de ventana activa. Lo comparto en el knowledge base.', FALSE),
  ('44444444-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', '¿Y si añadimos la velocidad de escritura como señal adicional? En hiperfoco, el WPM suele ser significativamente mayor. Esto me genera muchas ideas...', TRUE);
