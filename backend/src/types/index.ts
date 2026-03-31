export type UserRole =
  | 'admin'
  | 'architect_lead'
  | 'deep_contributor'
  | 'connector'
  | 'flow_guardian'
  | 'product_visionary'
  | 'devops_integrator'
  | 'quality_auditor'
  | 'stakeholder';

export type ProjectType = 'exploration' | 'delivery' | 'research' | 'maintenance' | 'innovation';
export type ProjectMethodology = 'kanban_aacc' | 'adaptive_sprint' | 'async_deep' | 'hybrid';
export type ProjectStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';

export type TaskType = 'implementation' | 'research' | 'spike' | 'review' | 'experiment' | 'documentation' | 'bug' | 'refactor';
export type CognitiveType = 'deep_focus' | 'creative' | 'routine' | 'collaborative' | 'exploratory';
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'blocked' | 'done' | 'cancelled';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low' | 'someday';
export type SprintStatus = 'planning' | 'active' | 'review' | 'completed';
export type AlertType = 'overload' | 'hyperfocus' | 'perfectionism_block' | 'missing_context' | 'consecutive_routine' | 'burnout_risk';
export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface CognitiveProfile {
  chronotype?: 'morning' | 'afternoon' | 'evening';
  preferred_tasks?: CognitiveType[];
  tolerance_ambiguity?: number; // 1-10
  overload_threshold?: number;  // 1-10
  min_focus_block?: number;     // minutes
  communication_preference?: 'async' | 'sync' | 'mixed';
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  cognitive_profile: CognitiveProfile;
  aacc_indicators?: Record<string, unknown>;
  timezone: string;
  is_active: boolean;
  created_at: string;
  last_seen_at?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  project_type: ProjectType;
  methodology: ProjectMethodology;
  status: ProjectStatus;
  cognitive_complexity: number;
  start_date?: string;
  target_date?: string;
  owner_id?: string;
  settings: Record<string, unknown>;
  tags: string[];
  created_at: string;
  updated_at: string;
  // Joined
  owner?: User;
  members?: User[];
  task_count?: number;
  sprint_count?: number;
  progress?: number;
}

export interface Sprint {
  id: string;
  project_id: string;
  name: string;
  goal: string;
  start_date: string;
  end_date: string;
  status: SprintStatus;
  total_cognitive_points?: number;
  team_capacity: Record<string, unknown>;
  retrospective?: Record<string, unknown>;
  created_at: string;
  // Joined
  task_count?: number;
  completed_pcc?: number;
}

export interface DoD {
  text: string;
  done: boolean;
}

export interface Task {
  id: string;
  project_id: string;
  parent_task_id?: string;
  sprint_id?: string;
  title: string;
  description?: string;
  task_type: TaskType;
  cognitive_type: CognitiveType;
  status: TaskStatus;
  priority: TaskPriority;
  cognitive_points: number;
  estimated_hours?: number;
  actual_hours?: number;
  assignee_id?: string;
  strategic_context?: string;
  definition_of_done: DoD[];
  dependencies: string[];
  tags: string[];
  blocked_reason?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joined
  assignee?: User;
  creator?: User;
  subtask_count?: number;
  completed_subtasks?: number;
  active_session?: CognitiveSession;
}

export interface CognitiveSession {
  id: string;
  user_id: string;
  task_id: string;
  started_at: string;
  ended_at?: string;
  energy_level_start: number;
  energy_level_end?: number;
  flow_mode: boolean;
  interruptions_count: number;
  quality_rating?: number;
  notes?: string;
  // Joined
  user?: User;
  task?: Task;
}

export interface Comment {
  id: string;
  task_id: string;
  author_id: string;
  content: string;
  is_thinking: boolean;
  parent_id?: string;
  created_at: string;
  updated_at: string;
  author?: User;
  replies?: Comment[];
}

export interface Notification {
  id: string;
  user_id: string;
  notification_type: 'mention' | 'comment_reply' | 'task_assigned' | 'task_completed';
  related_user_id?: string;
  comment_id?: string;
  task_id?: string;
  message: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  related_user?: User;
  comment?: Comment;
}

export interface CognitiveAlert {
  id: string;
  user_id: string;
  project_id?: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  message: string;
  metadata: Record<string, unknown>;
  resolved: boolean;
  resolved_at?: string;
  resolved_by?: string;
  created_at: string;
  user?: User;
}

export interface KnowledgeNode {
  id: string;
  project_id: string;
  title: string;
  content: string;
  node_type: string;
  author_id?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  author?: User;
}

export interface DashboardStats {
  active_projects: number;
  total_pcc_sprint: number;
  flow_ratio: number; // % hours in deep flow
  icc_team_avg: number;
  blocked_tasks: number;
  active_alerts: number;
}
