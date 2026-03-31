'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { dashboard, projects, wellness, tasks as tasksApi } from '@/lib/api';
import type { DashboardStats, Task, Activity, Project, CognitiveAlert } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { formatDateTime, TASK_STATUS_BG, COGNITIVE_TYPE_COLORS, COGNITIVE_TYPE_LABELS, getPCCClass, PRIORITY_LABELS, getInitials } from '@/lib/utils';

export default function DashboardPage() {
  const user = useAuthStore(s => s.user);
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [alerts, setAlerts] = useState<CognitiveAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBrainDump, setShowBrainDump] = useState(false);
  const [brainDumpText, setBrainDumpText] = useState('');
  const [brainDumpProject, setBrainDumpProject] = useState('');

  useEffect(() => {
    Promise.all([
      dashboard.get(),
      projects.list({ status: 'active' }),
      wellness.team(),
    ]).then(([dash, projs, well]) => {
      setStats(dash.stats);
      setMyTasks(dash.my_tasks);
      setActivity(dash.activity);
      setActiveProjects(projs.projects.slice(0, 4));
      setAlerts(well.alerts.filter(a => !a.resolved).slice(0, 3));
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 13 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  const timeEmoji = hour < 13 ? '☀️' : hour < 19 ? '🌤' : '🌙';

  if (loading) return <div className="flex items-center justify-center h-full text-text-2">Cargando dashboard...</div>;

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-text-0">
            {greeting}, {user?.full_name.split(' ')[0]} {timeEmoji}
          </h2>
          <p className="text-xs text-text-2 mt-1">
            {stats?.active_projects ?? 0} proyectos activos · Tu mejor hora según tu perfil
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowBrainDump(true)} className="btn btn-teal text-xs">🧠 Brain Dump</button>
          <button className="btn btn-primary text-xs">▶ Iniciar Sesión de Flujo</button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'PCC · Sprint activo', value: stats?.pcc_sprint ?? 0, trend: '↑ +12 vs. sprint anterior', trendColor: 'text-teal-dark', accent: 'from-purple to-transparent' },
          { label: 'Tiempo en flujo', value: '74%', trend: '↑ +8% esta semana', trendColor: 'text-teal-dark', accent: 'from-teal-dark to-transparent' },
          { label: 'ICC medio equipo', value: '3.2', trend: `${alerts.length > 0 ? '⚠ ' + alerts.length + ' alerta(s) activa(s)' : '✓ Todo OK'}`, trendColor: alerts.length > 0 ? 'text-amber' : 'text-teal-dark', accent: 'from-amber to-transparent' },
          { label: 'Tareas bloqueadas', value: stats?.blocked_tasks ?? 0, trend: '↓ Requieren atención', trendColor: 'text-red', accent: 'from-red to-transparent' },
        ].map((card, i) => (
          <div key={i} className="bg-bg-2 border border-border rounded-xl p-4 relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${card.accent}`} />
            <div className="text-3xl font-bold text-text-0">{card.value}</div>
            <div className="text-xs text-text-2 mt-1">{card.label}</div>
            <div className={`text-xs mt-2 ${card.trendColor}`}>{card.trend}</div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="mb-6">
          {alerts.map(alert => (
            <div key={alert.id} className={`flex items-start gap-3 px-4 py-3 rounded-xl mb-2 border ${
              alert.severity === 'critical' ? 'bg-red/8 border-red/20' :
              alert.severity === 'warning' ? 'bg-amber/8 border-amber/20' :
              'bg-purple/8 border-purple/20'
            }`}>
              <span className="text-base flex-shrink-0">{alert.severity === 'critical' ? '🔴' : alert.severity === 'warning' ? '⚠️' : 'ℹ️'}</span>
              <p className="text-xs text-text-1 flex-1">{alert.message}</p>
              <Link href="/wellness" className="text-xs text-purple hover:text-purple-light flex-shrink-0">Ver →</Link>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-5">
        {/* Projects */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Proyectos Activos</span>
            <Link href="/projects" className="text-xs text-purple hover:text-purple-light">Ver todos →</Link>
          </div>
          <div className="p-4 space-y-3">
            {activeProjects.map(p => (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <div className="bg-bg-3 border border-border hover:border-border-hi rounded-xl p-3 cursor-pointer transition-all hover:-translate-y-0.5 group">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-sm font-semibold text-text-0 group-hover:text-purple transition-colors">{p.name}</div>
                      <div className="text-xs text-text-3 mt-0.5 capitalize">{p.project_type} · {p.methodology.replace('_', ' ')}</div>
                    </div>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${
                      (p.progress ?? 0) > 75 ? 'bg-teal-dark shadow-[0_0_6px_#1D9E75]' :
                      (p.progress ?? 0) > 40 ? 'bg-amber shadow-[0_0_6px_#EF9F27]' :
                      'bg-red shadow-[0_0_6px_#E74C3C]'
                    }`} />
                  </div>
                  <div className="bg-bg-4 rounded-full h-1 mb-1.5">
                    <div className="h-1 rounded-full bg-gradient-to-r from-purple to-teal-dark" style={{ width: `${p.progress ?? 0}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-text-3">
                    <span>{p.progress ?? 0}% completado</span>
                    <span>{p.task_count ?? 0} tareas · CC {p.cognitive_complexity}/10</span>
                  </div>
                </div>
              </Link>
            ))}
            {activeProjects.length === 0 && (
              <div className="text-center py-8 text-text-3 text-sm">
                <div className="text-2xl mb-2">◈</div>
                No hay proyectos activos
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* My tasks */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Mis Tareas — Hoy</span>
              <span className="text-[10px] text-text-3">Por energía óptima</span>
            </div>
            <div className="p-3 space-y-0">
              {myTasks.slice(0, 5).map(task => (
                <Link key={task.id} href={`/tasks/${task.id}`}>
                  <div className="flex items-start gap-2.5 py-2.5 px-2 hover:bg-bg-3 rounded-lg cursor-pointer transition-all group border-b border-border last:border-0">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: COGNITIVE_TYPE_COLORS[task.cognitive_type] }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-text-0 group-hover:text-purple transition-colors leading-snug truncate">{task.title}</div>
                      <div className="text-[10px] text-text-3 mt-0.5">{task.project_name}</div>
                    </div>
                    <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded border font-mono flex-shrink-0 ${getPCCClass(task.cognitive_points)}`}>
                      PCC {task.cognitive_points}
                    </div>
                  </div>
                </Link>
              ))}
              {myTasks.length === 0 && (
                <div className="text-center py-6 text-text-3 text-xs">No tienes tareas asignadas</div>
              )}
            </div>
          </div>

          {/* Activity */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Actividad Reciente</span>
            </div>
            <div className="p-3 space-y-0">
              {activity.slice(0, 5).map((a, i) => (
                <div key={i} className="flex items-start gap-2 py-2 border-b border-border last:border-0">
                  <div className="w-1 h-1 rounded-full bg-purple mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-[11px] text-text-2"><span className="text-text-1 font-medium">{a.actor}</span> · {a.title?.slice(0, 50)}{(a.title?.length ?? 0) > 50 ? '...' : ''}</span>
                    <div className="text-[10px] text-text-3 mt-0.5">{formatDateTime(a.timestamp)}</div>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border ${TASK_STATUS_BG[a.status as keyof typeof TASK_STATUS_BG] || 'bg-bg-4 text-text-2 border-border'} flex-shrink-0`}>
                    {a.status}
                  </span>
                </div>
              ))}
              {activity.length === 0 && (
                <div className="text-center py-6 text-text-3 text-xs">Sin actividad reciente</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Brain Dump Modal */}
      {showBrainDump && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-0/80" onClick={() => setShowBrainDump(false)}>
          <div className="bg-bg-2 border border-border rounded-xl p-6 w-full max-w-lg shadow-xl animate-slide-up" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-text-0 mb-1">🧠 Brain Dump</h3>
            <p className="text-xs text-text-2 mb-4">Vacía tu mente. Cada línea se convertirá en una tarea en el backlog.</p>

            <select
              className="select w-full text-xs mb-3"
              value={brainDumpProject}
              onChange={e => setBrainDumpProject(e.target.value)}
            >
              <option value="">Seleccionar proyecto</option>
              {activeProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            <textarea
              className="input w-full h-40 resize-none text-sm font-mono"
              placeholder={"Una idea por línea...\nRefactorizar módulo de auth\nInvestigar WebSockets\nRevisar PR de Marc"}
              value={brainDumpText}
              onChange={e => setBrainDumpText(e.target.value)}
              autoFocus
            />

            <div className="flex items-center justify-between mt-4">
              <span className="text-[10px] text-text-3">
                {brainDumpText.split('\n').filter(l => l.trim()).length} tarea(s)
              </span>
              <div className="flex gap-2">
                <button onClick={() => setShowBrainDump(false)} className="btn btn-ghost text-xs">Cancelar</button>
                <button
                  className="btn btn-teal text-xs"
                  disabled={!brainDumpProject || !brainDumpText.trim()}
                  onClick={async () => {
                    const lines = brainDumpText.split('\n').filter(l => l.trim());
                    await Promise.all(lines.map(title =>
                      tasksApi.create({ project_id: brainDumpProject, title: title.trim(), task_type: 'implementation', priority: 'medium', cognitive_type: 'routine', cognitive_points: 3 })
                    ));
                    setBrainDumpText('');
                    setShowBrainDump(false);
                    router.refresh();
                  }}
                >
                  Crear {brainDumpText.split('\n').filter(l => l.trim()).length} tarea(s)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
