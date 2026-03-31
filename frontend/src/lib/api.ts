const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('acpm_token');
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const auth = {
  login: (email: string, password: string) =>
    apiFetch<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => apiFetch<{ user: User }>('/api/auth/me'),
  updateProfile: (data: Partial<User>) =>
    apiFetch<{ user: User }>('/api/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  changePassword: (current_password: string, new_password: string) =>
    apiFetch<{ success: boolean }>('/api/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ current_password, new_password }),
    }),
  forgotPassword: (email: string) =>
    apiFetch<{ success: boolean; message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  resetPassword: (token: string, new_password: string) =>
    apiFetch<{ success: boolean }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password }),
    }),
};

// ── Projects ──────────────────────────────────────────────────────────────────
export const projects = {
  list: (params?: { status?: string }) => {
    const qs = params?.status ? `?status=${params.status}` : '';
    return apiFetch<{ projects: Project[] }>(`/api/projects${qs}`);
  },
  get: (id: string) => apiFetch<{ project: Project }>(`/api/projects/${id}`),
  create: (data: Partial<Project>) =>
    apiFetch<{ project: Project }>('/api/projects', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Project>) =>
    apiFetch<{ project: Project }>(`/api/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch(`/api/projects/${id}`, { method: 'DELETE' }),
  members: (id: string) => apiFetch<{ members: ProjectMember[] }>(`/api/projects/${id}/members`),
  addMember: (id: string, user_id: string, role: string) =>
    apiFetch(`/api/projects/${id}/members`, { method: 'POST', body: JSON.stringify({ user_id, role }) }),
  removeMember: (id: string, memberId: string) =>
    apiFetch(`/api/projects/${id}/members/${memberId}`, { method: 'DELETE' }),
  stats: (id: string) => apiFetch(`/api/projects/${id}/stats`),
};

// ── Tasks ─────────────────────────────────────────────────────────────────────
export const tasks = {
  list: (params: { project_id?: string; sprint_id?: string; status?: string; assignee_id?: string; cognitive_type?: string }) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([,v]) => v !== undefined) as [string,string][]).toString();
    return apiFetch<{ tasks: Task[] }>(`/api/tasks?${qs}`);
  },
  get: (id: string) => apiFetch<{ task: Task }>(`/api/tasks/${id}`),
  create: (data: Partial<Task>) =>
    apiFetch<{ task: Task }>('/api/tasks', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Task>) =>
    apiFetch<{ task: Task }>(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch(`/api/tasks/${id}`, { method: 'DELETE' }),
  startSession: (taskId: string, data: { energy_level_start: number; flow_mode?: boolean }) =>
    apiFetch<{ session: CognitiveSession }>(`/api/tasks/${taskId}/sessions`, { method: 'POST', body: JSON.stringify(data) }),
  endSession: (taskId: string, sessionId: string, data: Partial<CognitiveSession>) =>
    apiFetch<{ session: CognitiveSession }>(`/api/tasks/${taskId}/sessions/${sessionId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  addComment: (taskId: string, data: { content: string; is_thinking?: boolean; parent_id?: string }) =>
    apiFetch<{ comment: Comment }>(`/api/tasks/${taskId}/comments`, { method: 'POST', body: JSON.stringify(data) }),
  updateComment: (taskId: string, commentId: string, data: { content: string; reason?: string }) =>
    apiFetch<{ comment: Comment }>(`/api/tasks/${taskId}/comments/${commentId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteComment: (taskId: string, commentId: string) =>
    apiFetch(`/api/tasks/${taskId}/comments/${commentId}`, { method: 'DELETE' }),
  getCommentEdits: (taskId: string, commentId: string) =>
    apiFetch<{ edits: Array<{ id: string; original_content: string; edited_by: string; edited_at: string; reason?: string; editor_name: string; editor_avatar?: string }>; current: { content: string; updated_at: string } }>
      (`/api/tasks/${taskId}/comments/${commentId}/edits`),
};

// ── Sprints ───────────────────────────────────────────────────────────────────
export const sprints = {
  list: (params?: { project_id?: string; status?: string }) => {
    const qs = new URLSearchParams(Object.entries(params || {}).filter(([,v]) => v !== undefined) as [string,string][]).toString();
    return apiFetch<{ sprints: Sprint[] }>(`/api/sprints?${qs}`);
  },
  create: (data: Partial<Sprint>) =>
    apiFetch<{ sprint: Sprint }>('/api/sprints', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Sprint>) =>
    apiFetch<{ sprint: Sprint }>(`/api/sprints/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

// ── Wellness ──────────────────────────────────────────────────────────────────
export const wellness = {
  team: (project_id?: string) => {
    const qs = project_id ? `?project_id=${project_id}` : '';
    return apiFetch<{ members: WellnessMember[]; alerts: CognitiveAlert[] }>(`/api/wellness/team${qs}`);
  },
  me: () => apiFetch<{ energy_trend: EnergyPoint[]; cognitive_stats: CognitiveStats[]; flow_stats: FlowStats; active_alerts: CognitiveAlert[] }>('/api/wellness/me'),
  resolveAlert: (id: string) => apiFetch(`/api/wellness/alerts/${id}/resolve`, { method: 'POST' }),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboard = {
  get: () => apiFetch<{ stats: DashboardStats; my_tasks: Task[]; activity: Activity[] }>('/api/dashboard'),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const users = {
  list: () => apiFetch<{ users: User[] }>('/api/users'),
  get: (id: string) => apiFetch<{ user: User }>(`/api/users/${id}`),
  search: (q: string) => apiFetch<{ users: User[] }>(`/api/users/search?q=${encodeURIComponent(q)}`),
  create: (data: { email: string; full_name: string; password: string; role?: UserRole }) =>
    apiFetch<{ user: User }>('/api/users', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<{ full_name: string; email: string; role: string; is_active: boolean }>) =>
    apiFetch<{ user: User }>(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => apiFetch(`/api/users/${id}`, { method: 'DELETE' }),
};

// ── Knowledge ─────────────────────────────────────────────────────────────────
export const knowledge = {
  list: (params?: { project_id?: string; node_type?: string }) => {
    const qs = new URLSearchParams(Object.entries(params || {}).filter(([,v]) => v !== undefined) as [string,string][]).toString();
    return apiFetch<{ nodes: KnowledgeNode[] }>(`/api/knowledge?${qs}`);
  },
  create: (data: Partial<KnowledgeNode>) =>
    apiFetch<{ node: KnowledgeNode }>('/api/knowledge', { method: 'POST', body: JSON.stringify(data) }),
};

// ── Types ─────────────────────────────────────────────────────────────────────
export type UserRole = 'admin' | 'architect_lead' | 'deep_contributor' | 'connector' | 'flow_guardian' | 'product_visionary' | 'devops_integrator' | 'quality_auditor' | 'stakeholder';
export type CognitiveType = 'deep_focus' | 'creative' | 'routine' | 'collaborative' | 'exploratory';
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'blocked' | 'done' | 'cancelled';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low' | 'someday';
export type ProjectStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';
export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface CognitiveProfile {
  chronotype?: 'morning' | 'afternoon' | 'evening';
  preferred_tasks?: CognitiveType[];
  tolerance_ambiguity?: number;
  overload_threshold?: number;
  min_focus_block?: number;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  cognitive_profile: CognitiveProfile;
  timezone: string;
  is_active: boolean;
  created_at: string;
  last_seen_at?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  project_type: string;
  methodology: string;
  status: ProjectStatus;
  cognitive_complexity: number;
  start_date?: string;
  target_date?: string;
  owner_id?: string;
  owner_name?: string;
  settings: Record<string, unknown>;
  tags: string[];
  created_at: string;
  updated_at: string;
  members?: ProjectMember[];
  task_count?: number;
  progress?: number;
}

export interface ProjectMember extends User {
  project_role: UserRole;
  joined_at: string;
}

export interface Sprint {
  id: string;
  project_id: string;
  name: string;
  goal: string;
  start_date: string;
  end_date: string;
  status: string;
  total_cognitive_points?: number;
  team_capacity: Record<string, unknown>;
  created_at: string;
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
  sprint_name?: string;
  title: string;
  description?: string;
  task_type: string;
  cognitive_type: CognitiveType;
  status: TaskStatus;
  priority: TaskPriority;
  cognitive_points: number;
  estimated_hours?: number;
  actual_hours?: number;
  assignee_id?: string;
  assignee_name?: string;
  assignee_avatar?: string;
  creator_name?: string;
  project_name?: string;
  strategic_context?: string;
  definition_of_done: DoD[];
  dependencies: string[];
  tags: string[];
  blocked_reason?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  subtasks?: Task[];
  sessions?: CognitiveSession[];
  comments?: TaskComment[];
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
  full_name?: string;
  avatar_url?: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  content: string;
  is_thinking: boolean;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CognitiveAlert {
  id: string;
  user_id: string;
  project_id?: string;
  alert_type: string;
  severity: AlertSeverity;
  message: string;
  metadata: Record<string, unknown>;
  resolved: boolean;
  created_at: string;
  full_name?: string;
}

export interface WellnessMember {
  id: string;
  full_name: string;
  avatar_url?: string;
  cognitive_profile: CognitiveProfile;
  avg_energy_7d: number;
  flow_sessions_7d: number;
  total_sessions_7d: number;
  active_pcc_load: number;
}

export interface EnergyPoint { date: string; avg_energy: number; sessions: number; }
export interface CognitiveStats { cognitive_type: CognitiveType; count: number; total_pcc: number; }
export interface FlowStats { total_sessions: number; flow_sessions: number; avg_session_hours: number; avg_quality: number; }
export interface DashboardStats { active_projects: number; pcc_sprint: number; blocked_tasks: number; active_alerts: number; }
export interface Activity { type: string; title: string; status: string; actor: string; timestamp: string; }
export interface KnowledgeNode { id: string; project_id: string; title: string; content: string; node_type: string; author_id?: string; author_name?: string; tags: string[]; created_at: string; updated_at: string; }
export interface Notification { id: string; user_id: string; notification_type: 'mention' | 'comment_reply' | 'task_assigned' | 'task_completed'; related_user_id?: string; comment_id?: string; task_id?: string; message: string; is_read: boolean; read_at?: string; created_at: string; related_user_name?: string; related_user_avatar?: string; comment_content?: string; task_title?: string; }

// ── Notifications ──────────────────────────────────────────────────────────────
export const notifications = {
  list: (unread?: boolean) => 
    apiFetch<{ notifications: Notification[] }>(`/api/notifications${unread ? '?unread=true' : ''}`),
  unreadCount: () => 
    apiFetch<{ unread_count: number }>('/api/notifications/unread-count'),
  markAsRead: (id: string) => 
    apiFetch<{ notification: Notification }>(`/api/notifications/${id}/read`, { method: 'PATCH', body: JSON.stringify({}) }),
  markAllAsRead: () => 
    apiFetch<{ success: boolean }>('/api/notifications/mark-all-read', { method: 'PATCH', body: JSON.stringify({}) }),
  delete: (id: string) => 
    apiFetch<{ success: boolean }>(`/api/notifications/${id}`, { method: 'DELETE' }),
};

// ── User Preferences ───────────────────────────────────────────────────────────
export interface UserPreferences {
  id: string;
  email: string;
  full_name: string;
  theme_preference: 'light' | 'high_contrast' | 'colorblind' | 'dark';
  text_to_speech_enabled: boolean;
  tts_voice: string;
  tts_rate: number;
}

export const userPreferences = {
  get: () => 
    apiFetch<UserPreferences>('/api/user/preferences'),
  profile: () => 
    apiFetch<User & { theme_preference: 'light' | 'high_contrast' | 'colorblind' | 'dark'; text_to_speech_enabled: boolean; tts_voice: string; tts_rate: number }>('/api/user/profile'),
  update: (data: Partial<{ theme_preference: string; text_to_speech_enabled: boolean; tts_voice: string; tts_rate: number }>) =>
    apiFetch<{ message: string; preferences: Partial<UserPreferences> }>('/api/user/preferences', { 
      method: 'PATCH', 
      body: JSON.stringify(data) 
    }),
};
