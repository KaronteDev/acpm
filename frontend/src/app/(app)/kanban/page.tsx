'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { tasks, projects } from '@/lib/api';
import type { Task, Project } from '@/lib/api';
import { COGNITIVE_TYPE_COLORS, COGNITIVE_TYPE_LABELS, getPCCClass, getInitials, TASK_STATUS_LABELS } from '@/lib/utils';

type KanbanStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'blocked' | 'done';

const COLUMNS: { id: KanbanStatus; label: string; color: string; icon: string }[] = [
  { id: 'backlog', label: 'Exploración', color: '#7F77DD', icon: '◌' },
  { id: 'todo', label: 'Por Hacer', color: '#6A8AAE', icon: '○' },
  { id: 'in_progress', label: 'En Progreso', color: '#7F77DD', icon: '◈' },
  { id: 'review', label: 'En Revisión', color: '#EF9F27', icon: '◉' },
  { id: 'blocked', label: 'Bloqueada', color: '#E74C3C', icon: '⊗' },
  { id: 'done', label: 'Completada', color: '#1D9E75', icon: '✓' },
];

export default function KanbanPage() {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [filterCog, setFilterCog] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [movingTask, setMovingTask] = useState<string | null>(null);

  useEffect(() => {
    projects.list({ status: 'active' }).then(r => {
      setProjectList(r.projects);
      if (r.projects.length > 0) setSelectedProject(r.projects[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedProject) return;
    setLoading(true);
    tasks.list({ project_id: selectedProject })
      .then(r => setAllTasks(r.tasks))
      .finally(() => setLoading(false));
  }, [selectedProject]);

  const getColumnTasks = (status: KanbanStatus) =>
    allTasks.filter(t => t.status === status && (!filterCog || t.cognitive_type === filterCog));

  async function moveTask(taskId: string, newStatus: string) {
    setMovingTask(taskId);
    try {
      const { task } = await tasks.update(taskId, { status: newStatus as Task['status'] });
      setAllTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...task } : t));
    } catch (e) {
      console.error(e);
    } finally {
      setMovingTask(null);
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="px-5 py-3 border-b border-border flex items-center gap-3 flex-shrink-0 bg-bg-1">
        <select
          className="select w-48 text-xs"
          value={selectedProject}
          onChange={e => setSelectedProject(e.target.value)}
        >
          <option value="">— Todos los proyectos —</option>
          {projectList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>

        <div className="flex gap-1.5">
          <button onClick={() => setFilterCog('')} className={`btn text-xs px-2.5 py-1.5 ${!filterCog ? 'btn-primary' : 'btn-ghost'}`}>Todos</button>
          {(['deep_focus','creative','routine','collaborative','exploratory'] as const).map(ct => (
            <button key={ct} onClick={() => setFilterCog(filterCog === ct ? '' : ct)}
              className={`btn text-xs px-2.5 py-1.5 ${filterCog === ct ? 'border-2' : 'btn-ghost'}`}
              style={filterCog === ct ? { borderColor: COGNITIVE_TYPE_COLORS[ct], color: COGNITIVE_TYPE_COLORS[ct], background: COGNITIVE_TYPE_COLORS[ct] + '20' } : {}}>
              {COGNITIVE_TYPE_LABELS[ct]}
            </button>
          ))}
        </div>

        <div className="ml-auto flex gap-2">
          <button className="btn btn-ghost text-xs">⬡ Vista Mapa</button>
          <Link href={selectedProject ? `/tasks/new?project=${selectedProject}` : '/tasks/new'}>
            <button className="btn btn-primary text-xs">+ Nueva Tarea</button>
          </Link>
        </div>
      </div>

      {/* Kanban columns */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-5">
        {loading ? (
          <div className="flex items-center justify-center h-full text-text-3">Cargando tablero...</div>
        ) : (
          <div className="flex gap-3.5 h-full">
            {COLUMNS.map(col => {
              const colTasks = getColumnTasks(col.id);
              return (
                <div key={col.id} className="flex-shrink-0 w-[220px] bg-bg-1 border border-border rounded-xl flex flex-col overflow-hidden">
                  {/* Column header */}
                  <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: col.color }}>{col.label}</span>
                    </div>
                    <span className="text-[10px] bg-bg-3 text-text-3 px-1.5 py-0.5 rounded-full font-mono">{colTasks.length}</span>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {colTasks.map(task => (
                      <KanbanCard
                        key={task.id}
                        task={task}
                        col={col}
                        moving={movingTask === task.id}
                        onMove={moveTask}
                        columns={COLUMNS}
                      />
                    ))}
                    {/* Add button */}
                    <Link href={`/tasks/new?project=${selectedProject}&status=${col.id}`}>
                      <div className="text-center py-2 text-xs text-text-3 cursor-pointer border border-dashed border-border rounded-lg hover:border-border-hi hover:text-text-2 transition-colors">
                        + Añadir
                      </div>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function KanbanCard({ task, col, moving, onMove, columns }: {
  task: Task;
  col: typeof COLUMNS[0];
  moving: boolean;
  onMove: (id: string, status: string) => void;
  columns: typeof COLUMNS;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const cogColor = COGNITIVE_TYPE_COLORS[task.cognitive_type];

  return (
    <div className={`bg-bg-2 border border-border rounded-lg p-2.5 transition-all relative group ${moving ? 'opacity-50' : 'hover:border-border-hi hover:-translate-y-0.5 cursor-pointer'}`}
      style={{ borderLeft: `3px solid ${cogColor}` }}>
      {/* Flow badge */}
      {task.active_session?.flow_mode && (
        <div className="flex items-center gap-1 text-[9px] text-teal-dark mb-1.5">
          <span>🛡</span><span>En Flujo Profundo</span>
        </div>
      )}
      {task.status === 'blocked' && (
        <div className="flex items-center gap-1 text-[9px] text-red mb-1.5">
          <span>🔴</span><span>Bloqueada</span>
        </div>
      )}

      <Link href={`/tasks/${task.id}`}>
        <p className="text-[11px] text-text-0 leading-snug mb-2 line-clamp-3">{task.title}</p>
      </Link>

      {/* Tags */}
      {task.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.slice(0, 2).map(t => <span key={t} className="text-[8px] font-mono bg-bg-4 text-text-3 px-1 py-0.5 rounded">{t}</span>)}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {/* Assignee */}
          {task.assignee_name && (
            <div className="w-4 h-4 rounded-full bg-purple/30 flex items-center justify-center text-[7px] font-bold text-purple">
              {getInitials(task.assignee_name)}
            </div>
          )}
          {/* Subtasks */}
          {(task.subtask_count ?? 0) > 0 && (
            <span className="text-[9px] text-text-3">{task.completed_subtasks}/{task.subtask_count}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className={`text-[9px] font-mono font-bold px-1 py-0.5 rounded border ${getPCCClass(task.cognitive_points)}`}>
            {task.cognitive_points}
          </span>
          {/* Move menu */}
          <div className="relative">
            <button
              onClick={e => { e.stopPropagation(); setShowMenu(s => !s); }}
              className="opacity-0 group-hover:opacity-100 text-text-3 hover:text-text-1 text-xs transition-opacity px-1"
            >⋮</button>
            {showMenu && (
              <div className="absolute right-0 bottom-full mb-1 bg-bg-3 border border-border rounded-lg shadow-xl z-20 min-w-[130px]">
                {columns.filter(c => c.id !== col.id).map(c => (
                  <button key={c.id} onClick={() => { onMove(task.id, c.id); setShowMenu(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-text-1 hover:bg-bg-4 hover:text-text-0 first:rounded-t-lg last:rounded-b-lg transition-colors">
                    → {c.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
