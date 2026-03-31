import { type ClassValue, clsx } from 'clsx';
import { CognitiveType, TaskStatus, TaskPriority, UserRole } from './api';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export function formatDateTime(date: string) {
  return new Date(date).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function formatDuration(startedAt: string, endedAt?: string) {
  const start = new Date(startedAt).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();
  const diffMs = end - start;
  const hours = Math.floor(diffMs / 3600000);
  const mins = Math.floor((diffMs % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${mins}min`;
  return `${mins}min`;
}

export const COGNITIVE_TYPE_LABELS: Record<CognitiveType, string> = {
  deep_focus: 'Deep Focus',
  creative: 'Creativo',
  routine: 'Rutina',
  collaborative: 'Colaborativo',
  exploratory: 'Exploratorio',
};

export const COGNITIVE_TYPE_COLORS: Record<CognitiveType, string> = {
  deep_focus: '#7F77DD',
  creative: '#EF9F27',
  routine: '#6A8AAE',
  collaborative: '#5DCAA5',
  exploratory: '#534AB7',
};

export const COGNITIVE_TYPE_BG: Record<CognitiveType, string> = {
  deep_focus: 'bg-purple/20 text-purple border border-purple/30',
  creative: 'bg-amber/20 text-amber border border-amber/30',
  routine: 'bg-text-2/20 text-text-2 border border-text-2/30',
  collaborative: 'bg-teal/20 text-teal-dark border border-teal/30',
  exploratory: 'bg-purple-dark/20 text-purple-light border border-purple-dark/30',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  todo: 'Por Hacer',
  in_progress: 'En Progreso',
  review: 'En Revisión',
  blocked: 'Bloqueada',
  done: 'Completada',
  cancelled: 'Cancelada',
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  backlog: 'text-text-2',
  todo: 'text-text-1',
  in_progress: 'text-purple',
  review: 'text-amber',
  blocked: 'text-red',
  done: 'text-teal-dark',
  cancelled: 'text-text-3',
};

export const TASK_STATUS_BG: Record<TaskStatus, string> = {
  backlog: 'bg-text-3/20 text-text-2',
  todo: 'bg-bg-4/60 text-text-1',
  in_progress: 'bg-purple/15 text-purple border border-purple/30',
  review: 'bg-amber/15 text-amber border border-amber/30',
  blocked: 'bg-red/15 text-red border border-red/30',
  done: 'bg-teal-dark/15 text-teal-dark border border-teal-dark/30',
  cancelled: 'bg-text-3/10 text-text-3',
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  critical: '⚡ Crítica',
  high: '⬆ Alta',
  medium: '→ Media',
  low: '⬇ Baja',
  someday: '◌ Algún día',
};

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  critical: 'text-red border-red/30 bg-red/10',
  high: 'text-amber border-amber/30 bg-amber/10',
  medium: 'text-text-1 border-border bg-bg-4',
  low: 'text-text-2 border-border/50 bg-bg-3',
  someday: 'text-text-3 border-transparent bg-transparent',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: '🛡️ Admin',
  architect_lead: '👑 Architect-Lead',
  deep_contributor: '🔬 Deep Contributor',
  connector: '🔗 Connector',
  flow_guardian: '🎯 Flow Guardian',
  product_visionary: '🚀 Product Visionary',
  devops_integrator: '⚙️ DevOps Integrator',
  quality_auditor: '👁️ Quality Auditor',
  stakeholder: '📊 Stakeholder',
};

export const ROLE_COLOR: Record<UserRole, string> = {
  admin: '#E74C3C',
  architect_lead: '#EF9F27',
  deep_contributor: '#7F77DD',
  connector: '#5DCAA5',
  flow_guardian: '#1D9E75',
  product_visionary: '#534AB7',
  devops_integrator: '#6A8AAE',
  quality_auditor: '#AFA9EC',
  stakeholder: '#B4C5E0',
};

export const PCC_VALUES = [1, 2, 3, 5, 8, 13, 21];

export function getPCCClass(pcc: number): string {
  if (pcc >= 13) return 'text-red bg-red/10 border-red/30';
  if (pcc >= 8) return 'text-amber bg-amber/10 border-amber/30';
  if (pcc >= 5) return 'text-purple bg-purple/10 border-purple/30';
  return 'text-teal-dark bg-teal-dark/10 border-teal-dark/30';
}

export function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

export function calcICC(activePCC: number, overloadThreshold: number = 10): number {
  return Math.min(10, (activePCC / overloadThreshold) * 10);
}

export function getICCColor(icc: number): string {
  if (icc >= 8) return '#E74C3C';
  if (icc >= 6) return '#EF9F27';
  return '#1D9E75';
}
