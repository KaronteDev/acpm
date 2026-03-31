'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { projects, tasks, sprints } from '@/lib/api';
import type { Project, Task, Sprint, ProjectMember } from '@/lib/api';
import { COGNITIVE_TYPE_COLORS, COGNITIVE_TYPE_LABELS, TASK_STATUS_BG, TASK_STATUS_LABELS, getPCCClass, getInitials, formatDate, ROLE_LABELS } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ConfirmDialog';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [projectSprints, setProjectSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tasks' | 'sprints' | 'members'>('tasks');
  const [editMode, setEditMode] = useState(false);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      projects.get(id),
      tasks.list({ project_id: id }),
      sprints.list({ project_id: id }),
    ]).then(([p, t, s]) => {
      setProject(p.project);
      setProjectTasks(t.tasks);
      setProjectSprints(s.sprints);
      // Save current project ID to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('acpm_current_project', id);
        localStorage.setItem('acpm_last_projects_route', `/projects/${id}`);
      }
    }).finally(() => setLoading(false));
  }, [id]);

  async function updateProject(field: string, value: unknown) {
    if (!project) return;
    const { project: updated } = await projects.update(project.id, { [field]: value } as Partial<Project>);
    setProject(prev => prev ? { ...prev, ...updated } : null);
  }

  async function handleDeleteProject() {
    if (!project) return;
    try {
      await projects.delete(project.id);
      router.push('/projects');
    } catch (err) {
      alert('Error al eliminar el proyecto');
    }
  }

  if (loading) return <div className="flex items-center justify-center h-full text-text-3">Cargando proyecto...</div>;
  if (!project) return <div className="flex items-center justify-center h-full text-text-3">Proyecto no encontrado</div>;

  const byStatus = (status: string) => projectTasks.filter(t => t.status === status);
  const totalPCC = projectTasks.reduce((s, t) => s + t.cognitive_points, 0);
  const donePCC = projectTasks.filter(t => t.status === 'done').reduce((s, t) => s + t.cognitive_points, 0);

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-xs text-text-3 mb-2">
            <Link href="/projects" className="hover:text-text-1">← Proyectos</Link>
            <span>/</span>
            <span className="text-text-2">{project.name}</span>
          </div>
          {editMode ? (
            <>
              <textarea
                className="textarea text-2xl font-bold w-full mb-2"
                defaultValue={project.name}
                autoFocus
                rows={2}
                onBlur={e => { updateProject('name', e.target.value); setEditMode(false); }}
              />
              <textarea
                className="textarea text-sm w-full mb-2"
                defaultValue={project.description}
                rows={2}
                onBlur={e => updateProject('description', e.target.value)}
                placeholder="Descripción del proyecto"
              />
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-text-0 cursor-text hover:bg-bg-3 rounded-lg px-2 py-1 -mx-2 transition-colors"
                onClick={() => setEditMode(true)}>{project.name}</h2>
              {project.description && <p className="text-sm text-text-2 mt-1 max-w-2xl hover:bg-bg-3 rounded-lg px-2 py-1 cursor-text" onClick={() => setEditMode(true)}>{project.description}</p>}
            </>
          )}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {project.tags?.map(t => <span key={t} className="text-[9px] font-mono bg-bg-4 text-text-3 px-1.5 py-0.5 rounded">{t}</span>)}
          </div>
        </div>
        <div className="flex gap-2 ml-4">
          <button
            className="px-3 py-2 rounded-lg bg-purple/10 text-purple hover:bg-purple/20 hover:shadow-sm transition-all text-xs font-medium border border-purple/30 hover:border-purple/50"
            onClick={() => setShowEditPanel(true)}
          >
            ✎ Editar proyecto
          </button>
          <button
            className="px-3 py-2 rounded-lg bg-red/10 text-red hover:bg-red/20 hover:shadow-sm transition-all text-xs font-medium border border-red/30 hover:border-red/50"
            onClick={() => setShowDeleteConfirm(true)}
          >
            🗑 Eliminar proyecto
          </button>
          <Link href={`/kanban?project=${project.id}`}>
            <button className="btn btn-ghost text-xs">⊞ Kanban</button>
          </Link>
          <Link href={`/tasks/new?project=${project.id}`}>
            <button className="btn btn-primary text-xs">+ Nueva Tarea</button>
          </Link>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Progreso', value: `${project.progress ?? 0}%`, sub: `${byStatus('done').length}/${projectTasks.length} tareas` },
          { label: 'PCC Total', value: totalPCC, sub: `${donePCC} completados` },
          { label: 'Bloqueadas', value: byStatus('blocked').length, sub: 'requieren atención', color: byStatus('blocked').length > 0 ? 'text-red' : 'text-teal-dark' },
          { label: 'En Progreso', value: byStatus('in_progress').length, sub: 'tareas activas', color: 'text-purple' },
          { label: 'CC Global', value: `${project.cognitive_complexity}/10`, sub: 'complejidad cognitiva' },
        ].map((s, i) => (
          <div key={i} className="bg-bg-2 border border-border rounded-xl p-3 text-center">
            <div className={`text-2xl font-bold ${s.color ?? 'text-text-0'}`}>{s.value}</div>
            <div className="text-[10px] text-text-3 mt-0.5">{s.label}</div>
            <div className="text-[9px] text-text-3">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="bg-bg-2 border border-border rounded-xl p-4 mb-5">
        <div className="flex items-center justify-between mb-2 text-xs">
          <span className="text-text-2">Progreso del proyecto</span>
          <span className="font-mono text-text-1">{project.progress ?? 0}%</span>
        </div>
        <div className="bg-bg-4 rounded-full h-2">
          <div className="h-2 rounded-full bg-gradient-to-r from-purple to-teal-dark transition-all" style={{ width: `${project.progress ?? 0}%` }} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-border">
        {[['tasks','Tareas'], ['sprints','Sprints'], ['members','Equipo']].map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab as never)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab ? 'text-purple border-purple' : 'text-text-2 border-transparent hover:text-text-1'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Tasks tab */}
      {activeTab === 'tasks' && (
        <div className="space-y-2">
          {projectTasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-3xl mb-3">◌</div>
              <p className="text-text-2 text-sm">No hay tareas en este proyecto</p>
              <Link href={`/tasks/new?project=${project.id}`}>
                <button className="btn btn-primary text-xs mt-4">Crear primera tarea</button>
              </Link>
            </div>
          ) : projectTasks.map(task => (
            <Link key={task.id} href={`/tasks/${task.id}`}
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.setItem('acpm_task_source_project', project.id);
                }
              }}
            >
              <div className="flex items-center gap-3 bg-bg-2 border border-border hover:border-border-hi rounded-xl px-4 py-3 transition-all cursor-pointer group"
                style={{ borderLeft: `3px solid ${COGNITIVE_TYPE_COLORS[task.cognitive_type]}` }}>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text-0 group-hover:text-purple transition-colors truncate">{task.title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-text-3">{COGNITIVE_TYPE_LABELS[task.cognitive_type]}</span>
                    {task.sprint_name && <span className="text-[10px] text-text-3">· {task.sprint_name}</span>}
                    {task.tags?.slice(0, 2).map(t => <span key={t} className="text-[8px] font-mono bg-bg-4 text-text-3 px-1 py-0.5 rounded">{t}</span>)}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {task.assignee_name && (
                    <div className="w-6 h-6 rounded-full bg-purple/20 flex items-center justify-center text-[8px] font-bold text-purple">{getInitials(task.assignee_name)}</div>
                  )}
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${getPCCClass(task.cognitive_points)}`}>{task.cognitive_points}</span>
                  <span className={`text-[9px] px-2 py-1 rounded border ${TASK_STATUS_BG[task.status]}`}>{TASK_STATUS_LABELS[task.status]}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Sprints tab */}
      {activeTab === 'sprints' && (
        <div className="space-y-3">
          {projectSprints.map(sprint => (
            <div key={sprint.id} className="bg-bg-2 border border-border rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-sm font-semibold text-text-0">{sprint.name}</div>
                  <div className="text-xs text-text-2 mt-0.5">{sprint.goal}</div>
                </div>
                <span className={`text-[10px] px-2 py-1 rounded border ${
                  sprint.status === 'active' ? 'bg-teal-dark/15 text-teal-dark border-teal-dark/30' :
                  sprint.status === 'completed' ? 'bg-bg-4 text-text-3 border-border' :
                  'bg-purple/15 text-purple border-purple/30'
                }`}>{sprint.status}</span>
              </div>
              <div className="flex items-center gap-4 text-[10px] text-text-3">
                <span>{formatDate(sprint.start_date)} → {formatDate(sprint.end_date)}</span>
                <span>{sprint.task_count ?? 0} tareas</span>
                <span className="font-mono text-purple">{sprint.completed_pcc ?? 0}/{sprint.total_cognitive_points ?? '?'} PCC</span>
              </div>
            </div>
          ))}
          {projectSprints.length === 0 && (
            <div className="text-center py-12 text-text-3 text-sm">No hay sprints en este proyecto</div>
          )}
        </div>
      )}

      {/* Members tab */}
      {activeTab === 'members' && (
        <div className="grid grid-cols-2 gap-3">
          {(project.members as ProjectMember[] | undefined)?.map(m => (
            <div key={m.id} className="bg-bg-2 border border-border rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple/20 flex items-center justify-center font-bold text-purple flex-shrink-0">
                {getInitials(m.full_name)}
              </div>
              <div>
                <div className="text-sm font-semibold text-text-0">{m.full_name}</div>
                <div className="text-xs text-text-3">{ROLE_LABELS[m.project_role]}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Panel Modal */}
      {showEditPanel && (
        <div className="fixed inset-0 bg-bg-0/80 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-2 border border-border rounded-2xl w-full max-w-md p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-text-0 mb-4">Editar Proyecto</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-text-2 block mb-1">Nombre</label>
                <input type="text" className="input w-full" defaultValue={project.name}
                  onBlur={e => updateProject('name', e.target.value)} />
              </div>

              <div>
                <label className="text-sm text-text-2 block mb-1">Descripción</label>
                <textarea className="textarea w-full" rows={3} defaultValue={project.description}
                  onBlur={e => updateProject('description', e.target.value)} 
                  placeholder="Descripción del proyecto" />
              </div>

              <div>
                <label className="text-sm text-text-2 block mb-1">Tipo de Proyecto</label>
                <select className="select w-full" value={project.project_type} 
                  onChange={e => updateProject('project_type', e.target.value)}>
                  {(['exploration','delivery','research','maintenance','innovation'] as const).map(t => 
                    <option key={t} value={t}>{t}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="text-sm text-text-2 block mb-1">Metodología</label>
                <select className="select w-full" value={project.methodology} 
                  onChange={e => updateProject('methodology', e.target.value)}>
                  {(['kanban_aacc','adaptive_sprint','async_deep','hybrid'] as const).map(m => 
                    <option key={m} value={m}>{m}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="text-sm text-text-2 block mb-1">Complejidad Cognitiva (1-10)</label>
                <input type="number" className="input w-full" min="1" max="10" value={project.cognitive_complexity} 
                  onChange={e => updateProject('cognitive_complexity', +e.target.value)} />
              </div>

              <div>
                <label className="text-sm text-text-2 block mb-1">Fecha de Inicio</label>
                <input type="date" className="input w-full" value={project.start_date?.split('T')[0] || ''} 
                  onChange={e => updateProject('start_date', e.target.value)} />
              </div>

              <div>
                <label className="text-sm text-text-2 block mb-1">Fecha Objetivo</label>
                <input type="date" className="input w-full" value={project.target_date?.split('T')[0] || ''} 
                  onChange={e => updateProject('target_date', e.target.value)} />
              </div>

              <div>
                <label className="text-sm text-text-2 block mb-1">Estado</label>
                <select className="select w-full" value={project.status} 
                  onChange={e => updateProject('status', e.target.value)}>
                  {(['draft','active','paused','completed','archived'] as const).map(s => 
                    <option key={s} value={s}>{s}</option>
                  )}
                </select>
              </div>

              <div>
                <label className="text-sm text-text-2 block mb-1">Etiquetas</label>
                <input type="text" className="input w-full" value={project.tags?.join(', ') || ''} 
                  onChange={e => updateProject('tags', e.target.value ? e.target.value.split(',').map(t => t.trim()) : [])} 
                  placeholder="Separadas por comas" />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={() => setShowEditPanel(false)} className="btn btn-ghost flex-1 justify-center">Cancelar</button>
              <button onClick={() => setShowEditPanel(false)} className="btn btn-primary flex-1 justify-center">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Eliminar proyecto"
        message="¿Está seguro que desea eliminar este proyecto? Se eliminarán todas las tareas asociadas. No se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDangerous
        onConfirm={() => {
          setShowDeleteConfirm(false);
          handleDeleteProject();
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
