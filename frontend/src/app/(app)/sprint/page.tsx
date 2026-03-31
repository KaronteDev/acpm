'use client';
import { useEffect, useState } from 'react';
import { sprints, tasks, projects } from '@/lib/api';
import type { Sprint, Task, Project } from '@/lib/api';
import { COGNITIVE_TYPE_COLORS, COGNITIVE_TYPE_LABELS, getPCCClass, getInitials } from '@/lib/utils';

export default function SprintPage() {
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [activeSprints, setActiveSprints] = useState<Sprint[]>([]);
  const [backlog, setBacklog] = useState<Task[]>([]);
  const [sprintTasks, setSprintTasks] = useState<Task[]>([]);
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null);
  const [loading, setLoading] = useState(false);

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
      tasks.list({ project_id: selectedProject, sprint_id: 'null', status: 'backlog' }),
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
    await tasks.update(task.id, { sprint_id: selectedSprint.id, status: 'todo' });
    setBacklog(prev => prev.filter(t => t.id !== task.id));
    setSprintTasks(prev => [...prev, { ...task, sprint_id: selectedSprint.id }]);
  }

  async function removeFromSprint(task: Task) {
    await tasks.update(task.id, { sprint_id: undefined, status: 'backlog' });
    setSprintTasks(prev => prev.filter(t => t.id !== task.id));
    setBacklog(prev => [...prev, { ...task, sprint_id: undefined }]);
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
      {activeSprints.length > 0 && (
        <div className="flex gap-2 mb-5">
          {activeSprints.map(s => (
            <button key={s.id} onClick={() => setSelectedSprint(s)}
              className={`btn text-xs ${selectedSprint?.id === s.id ? 'btn-primary' : 'btn-ghost'}`}>
              {s.name}
              <span className="text-[9px] ml-1 opacity-70">{s.status}</span>
            </button>
          ))}
          <button className="btn btn-ghost text-xs">+ Nuevo Sprint</button>
        </div>
      )}

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
                    <div key={task.id} className="flex items-center gap-3 bg-bg-2 border border-border rounded-xl px-3 py-2.5 hover:border-border-hi transition-all group">
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
                  {sprintTasks.map(task => (
                    <div key={task.id} className="flex items-center gap-3 bg-bg-2 border border-purple/20 rounded-xl px-3 py-2.5 hover:border-border-hi transition-all group" style={{ borderLeft: `3px solid ${COGNITIVE_TYPE_COLORS[task.cognitive_type]}` }}>
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
    </div>
  );
}
