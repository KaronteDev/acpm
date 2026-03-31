'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { sprints, tasks, projects } from '@/lib/api';
import type { Sprint, Task, Project } from '@/lib/api';
import { COGNITIVE_TYPE_COLORS, COGNITIVE_TYPE_LABELS, getPCCClass, getInitials } from '@/lib/utils';

export default function SprintPage() {
  const router = useRouter();
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [activeSprints, setActiveSprints] = useState<Sprint[]>([]);
  const [backlog, setBacklog] = useState<Task[]>([]);
  const [sprintTasks, setSprintTasks] = useState<Task[]>([]);
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSprintData, setNewSprintData] = useState({ name: '', goal: '', start_date: '', end_date: '' });
  const [creatingSprint, setCreatingSprint] = useState(false);
  const [createError, setCreateError] = useState('');
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    projects.list({ status: 'active' }).then(r => {
      setProjectList(r.projects);
      if (r.projects.length) setSelectedProject(r.projects[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedProject) return;
    setLoading(true);
    Promise.all([
      sprints.list({ project_id: selectedProject }),
      tasks.list({ project_id: selectedProject, sprint_id: undefined, status: 'backlog' }),
    ]).then(([sps, bl]) => {
      setActiveSprints(sps.sprints);
      setBacklog(bl.tasks);
      const active = sps.sprints.find(s => s.status === 'active');
      if (active) setSelectedSprint(active);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [selectedProject]);

  useEffect(() => {
    if (!selectedSprint) return;
    tasks.list({ sprint_id: selectedSprint.id })
      .then(r => setSprintTasks(r.tasks)).catch(() => {});
  }, [selectedSprint]);

  async function addToSprint(task: Task) {
    if (!selectedSprint) return;
    const nextOrder = sprintTasks.length > 0 
      ? Math.max(...sprintTasks.map(t => t.display_order ?? 0)) + 1 
      : 0;
    
    await tasks.update(task.id, { sprint_id: selectedSprint.id, status: 'todo', display_order: nextOrder });
    setBacklog(prev => prev.filter(t => t.id !== task.id));
    setSprintTasks(prev => [...prev, { ...task, sprint_id: selectedSprint.id, display_order: nextOrder }]);
  }

  async function removeFromSprint(task: Task) {
    await tasks.update(task.id, { sprint_id: undefined, status: 'backlog' });
    setSprintTasks(prev => prev.filter(t => t.id !== task.id));
    setBacklog(prev => [...prev, { ...task, sprint_id: undefined }]);
  }

  function handleDragStart(taskId: string, e: React.DragEvent<HTMLDivElement>) {
    setDraggedTask(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('taskId', taskId);
  }

  function handleDragOver(index: number, e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }

  function handleDragLeave() {
    setDragOverIndex(null);
  }

  async function handleDrop(index: number, e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('taskId');
    
    if (!draggedId || !selectedSprint) return;

    const draggedIdx = sprintTasks.findIndex(t => t.id === draggedId);
    if (draggedIdx === -1 || draggedIdx === index) {
      setDragOverIndex(null);
      return;
    }

    // Update local state with new order
    const newTasks = [...sprintTasks];
    const [draggedItem] = newTasks.splice(draggedIdx, 1);
    newTasks.splice(index, 0, draggedItem);

    setSprintTasks(newTasks);
    setDraggedTask(null);
    setDragOverIndex(null);

    // Persist the new order to backend
    try {
      const taskIds = newTasks.map(t => t.id);
      await sprints.reorder(selectedSprint.id, taskIds);
      console.log('✅ Tareas reordenadas exitosamente');
    } catch (err) {
      console.error('❌ Error reordenando tareas:', err);
      // Revert on error
      setSprintTasks([...sprintTasks]);
    }
  }

  async function createNewSprint() {
    setCreateError('');
    
    if (!selectedProject) {
      setCreateError('Selecciona un proyecto primero');
      return;
    }
    
    if (!newSprintData.name.trim()) {
      setCreateError('El nombre del sprint es requerido');
      return;
    }

    if (!newSprintData.start_date || !newSprintData.end_date) {
      setCreateError('Las fechas de inicio y fin son requeridas');
      return;
    }

    const startDate = new Date(newSprintData.start_date);
    const endDate = new Date(newSprintData.end_date);
    
    if (startDate >= endDate) {
      setCreateError('La fecha de fin debe ser posterior a la fecha de inicio');
      return;
    }

    try {
      setCreatingSprint(true);
      const payload = {
        project_id: selectedProject,
        name: newSprintData.name,
        goal: newSprintData.goal,
        start_date: newSprintData.start_date,
        end_date: newSprintData.end_date,
      };
      console.group('🚀 Sprint Creation');
      console.log('📤 Payload:', payload);
      const result = await sprints.create(payload);
      console.log('📨 Raw response:', result);
      const { sprint } = result;
      console.log('🎯 Sprint object:', sprint);
      console.log('📋 Current activeSprints before update:', activeSprints);

      setActiveSprints(prev => {
        const updated = [sprint, ...prev];
        console.log('📊 Updated activeSprints:', updated);
        return updated;
      });
      setSelectedSprint(sprint);
      setShowCreateModal(false);
      setNewSprintData({ name: '', goal: '', start_date: '', end_date: '' });
      console.log('✅ Sprint creation completed successfully');
      console.groupEnd();
    } catch (err) {
      console.error('❌ Error creating sprint:', err);
      setCreateError(err instanceof Error ? err.message : 'Error al crear el sprint');
      console.groupEnd();
    } finally {
      setCreatingSprint(false);
    }
  }

  const sprintPCC = sprintTasks.reduce((s, t) => s + t.cognitive_points, 0);
  const cogDist = (['deep_focus','creative','routine','collaborative','exploratory'] as const).map(ct => ({
    type: ct, count: sprintTasks.filter(t => t.cognitive_type === ct).length,
    pcc: sprintTasks.filter(t => t.cognitive_type === ct).reduce((s, t) => s + t.cognitive_points, 0),
  }));

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-text-0">Planificador de Sprint Cognitivo</h2>
          <p className="text-xs text-text-2 mt-1">Distribuye las tareas respetando la carga cognitiva del equipo</p>
        </div>
        <select
          className="select w-56 text-xs"
          value={selectedProject}
          onChange={e => setSelectedProject(e.target.value)}
        >
          {projectList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* Sprint selector */}
      <div className="flex gap-2 mb-5 items-center">
        {activeSprints.length > 0 ? (
          <>
            {activeSprints.map(s => (
              <button key={s.id} onClick={() => setSelectedSprint(s)}
                className={`btn text-xs ${selectedSprint?.id === s.id ? 'btn-primary' : 'btn-ghost'}`}>
                {s.name}
                <span className="text-[9px] ml-1 opacity-70">{s.status}</span>
              </button>
            ))}
            <button onClick={() => setShowCreateModal(true)} className="btn btn-ghost text-xs">+ Nuevo Sprint</button>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-2">No hay sprints aún</span>
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary text-xs">+ Crear Primer Sprint</button>
          </div>
        )}
      </div>

      {selectedSprint && (
        <>
          {/* Sprint info */}
          <div className="bg-bg-2 border border-border rounded-xl p-4 mb-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-sm font-semibold text-text-0">{selectedSprint.name}</div>
                <div className="text-xs text-text-2 mt-0.5">{selectedSprint.goal}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-text-3">PCC en sprint</div>
                <div className="text-2xl font-bold text-purple font-mono">{sprintPCC}</div>
              </div>
            </div>

            {/* Cognitive distribution */}
            <div className="text-[10px] text-text-3 mb-2">Distribución cognitiva — ideal: 40% deep / 40% creativo / 20% rutina</div>
            <div className="flex gap-1.5">
              {cogDist.filter(d => d.count > 0).map(d => (
                <div key={d.type} className="flex items-center gap-1.5 bg-bg-3 rounded-lg px-2.5 py-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COGNITIVE_TYPE_COLORS[d.type] }} />
                  <span className="text-[10px] text-text-2">{COGNITIVE_TYPE_LABELS[d.type]}</span>
                  <span className="font-mono text-[10px] font-bold text-text-1">{d.pcc} PCC</span>
                </div>
              ))}
            </div>

            {/* Cognitive balance check */}
            {sprintTasks.length > 0 && (() => {
              const deepRatio = (cogDist.find(d => d.type === 'deep_focus')?.count ?? 0) / sprintTasks.length;
              const routineRatio = (cogDist.find(d => d.type === 'routine')?.count ?? 0) / sprintTasks.length;
              if (routineRatio > 0.5) return <div className="mt-2 text-xs text-amber bg-amber/10 rounded-lg px-3 py-2">⚠️ Demasiadas tareas rutinarias consecutivas — riesgo de desmotivación AACC</div>;
              if (deepRatio > 0.8) return <div className="mt-2 text-xs text-amber bg-amber/10 rounded-lg px-3 py-2">⚠️ Exceso de tareas de alta concentración sin anclaje — riesgo de dispersión</div>;
              return <div className="mt-2 text-xs text-teal-dark bg-teal-dark/10 rounded-lg px-3 py-2">✓ Distribución cognitiva equilibrada</div>;
            })()}
          </div>

          {loading ? (
            <div className="text-center py-10 text-text-3">Cargando...</div>
          ) : (
            <div className="grid grid-cols-2 gap-5">
              {/* Backlog */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-semibold text-text-2 uppercase tracking-wider">Backlog disponible</div>
                  <span className="text-[10px] text-text-3 font-mono">{backlog.length} tareas</span>
                </div>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {backlog.map(task => (
                    <div 
                      key={task.id} 
                      onDoubleClick={() => router.push(`/tasks/${task.id}`)}
                      className="flex items-center gap-3 bg-bg-2 border border-border rounded-xl px-3 py-2.5 hover:border-border-hi transition-all group cursor-pointer"
                    >
                      <span className={`font-mono text-xs font-bold w-6 text-center ${getPCCClass(task.cognitive_points).split(' ')[0]}`}>{task.cognitive_points}</span>
                      <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: COGNITIVE_TYPE_COLORS[task.cognitive_type] }} />
                      <span className="text-xs text-text-1 flex-1 line-clamp-1">{task.title}</span>
                      <button
                        onClick={() => addToSprint(task)}
                        className="opacity-0 group-hover:opacity-100 btn btn-ghost text-[10px] px-2 py-1 transition-opacity"
                      >
                        → Sprint
                      </button>
                    </div>
                  ))}
                  {backlog.length === 0 && <div className="text-center py-8 text-text-3 text-xs">El backlog está vacío</div>}
                </div>
              </div>

              {/* Sprint tasks */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-semibold text-text-2 uppercase tracking-wider">En sprint — {sprintPCC} PCC</div>
                  <span className="text-[10px] text-text-3 font-mono">{sprintTasks.length} tareas</span>
                </div>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {sprintTasks.map((task, idx) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(task.id, e)}
                      onDragOver={(e) => handleDragOver(idx, e)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(idx, e)}
                      onDoubleClick={() => router.push(`/tasks/${task.id}`)}
                      className={`flex items-center gap-3 bg-bg-2 border border-purple/20 rounded-xl px-3 py-2.5 transition-all group cursor-grab active:cursor-grabbing ${
                        draggedTask === task.id ? 'opacity-50' : ''
                      } ${
                        dragOverIndex === idx ? 'border-purple border-2 bg-purple/5' : 'hover:border-border-hi'
                      }`}
                      style={{ borderLeft: `3px solid ${COGNITIVE_TYPE_COLORS[task.cognitive_type]}` }}
                    >
                      <span className="text-text-3 cursor-grab active:cursor-grabbing">⋮</span>
                      <span className={`font-mono text-xs font-bold w-6 text-center ${getPCCClass(task.cognitive_points).split(' ')[0]}`}>{task.cognitive_points}</span>
                      <span className="text-xs text-text-1 flex-1 line-clamp-1">{task.title}</span>
                      {task.assignee_name && (
                        <div className="w-5 h-5 rounded-full bg-purple/20 flex items-center justify-center text-[8px] text-purple font-bold flex-shrink-0">
                          {getInitials(task.assignee_name)}
                        </div>
                      )}
                      <button
                        onClick={() => removeFromSprint(task)}
                        className="opacity-0 group-hover:opacity-100 text-text-3 hover:text-red transition-all text-xs"
                      >✕</button>
                    </div>
                  ))}
                  {sprintTasks.length === 0 && (
                    <div className="border border-dashed border-border rounded-xl p-6 text-center text-text-3 text-xs">
                      Arrastra tareas del backlog o haz clic en "→ Sprint"
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Sprint Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-1 rounded-xl border border-border p-6 max-w-md w-full mx-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-text-0">Crear Nuevo Sprint</h3>
              <button onClick={() => { setShowCreateModal(false); setCreateError(''); }} className="text-text-3 hover:text-text-1">✕</button>
            </div>

            {createError && (
              <div className="p-3 rounded-lg text-sm" style={{
                backgroundColor: 'color-mix(in srgb, var(--accent-red) 15%, transparent)',
                borderColor: 'color-mix(in srgb, var(--accent-red) 30%, transparent)',
                color: 'var(--accent-red)',
                borderWidth: '1px'
              }}>
                {createError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-text-1 mb-1.5">Nombre del Sprint</label>
                <input
                  type="text"
                  placeholder="ej: Sprint 1 - Q2 2026"
                  value={newSprintData.name}
                  onChange={e => setNewSprintData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-bg-3 border border-border rounded-lg px-3 py-2 text-sm text-text-0 focus:outline-none focus:border-border-hi"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-1 mb-1.5">Objetivo (opcional)</label>
                <textarea
                  placeholder="ej: Implementar autenticación OAuth2"
                  value={newSprintData.goal}
                  onChange={e => setNewSprintData(prev => ({ ...prev, goal: e.target.value }))}
                  className="w-full bg-bg-3 border border-border rounded-lg px-3 py-2 text-sm text-text-0 focus:outline-none focus:border-border-hi resize-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-1 mb-1.5">Fecha de inicio</label>
                  <input
                    type="date"
                    value={newSprintData.start_date}
                    onChange={e => setNewSprintData(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-full bg-bg-3 border border-border rounded-lg px-3 py-2 text-sm text-text-0 focus:outline-none focus:border-border-hi"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-1 mb-1.5">Fecha de fin</label>
                  <input
                    type="date"
                    value={newSprintData.end_date}
                    onChange={e => setNewSprintData(prev => ({ ...prev, end_date: e.target.value }))}
                    className="w-full bg-bg-3 border border-border rounded-lg px-3 py-2 text-sm text-text-0 focus:outline-none focus:border-border-hi"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => { setShowCreateModal(false); setCreateError(''); }}
                className="flex-1 btn btn-ghost text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={createNewSprint}
                disabled={creatingSprint}
                className="flex-1 btn btn-primary text-xs disabled:opacity-50"
              >
                {creatingSprint ? 'Creando...' : 'Crear Sprint'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
