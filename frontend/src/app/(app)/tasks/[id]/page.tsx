'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { tasks, users } from '@/lib/api';
import type { Task, User, DoD, CognitiveSession, TaskComment } from '@/lib/api';
import {
  COGNITIVE_TYPE_LABELS, COGNITIVE_TYPE_BG, TASK_STATUS_BG, TASK_STATUS_LABELS,
  PRIORITY_LABELS, PRIORITY_COLORS, getPCCClass, formatDateTime, formatDuration, getInitials, PCC_VALUES
} from '@/lib/utils';
import { useAuthStore } from '@/lib/store';

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const currentUser = useAuthStore(s => s.user);
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [editTitle, setEditTitle] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [startingSession, setStartingSession] = useState(false);
  const [energyModal, setEnergyModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    tasks.get(id).then(r => setTask(r.task)).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  async function updateField(field: string, value: unknown) {
    if (!task) return;
    const { task: updated } = await tasks.update(task.id, { [field]: value } as Partial<Task>);
    setTask(prev => prev ? { ...prev, ...updated } : null);
  }

  async function toggleDoD(index: number) {
    if (!task) return;
    const newDoD = task.definition_of_done.map((item, i) => i === index ? { ...item, done: !item.done } : item);
    await updateField('definition_of_done', newDoD);
  }

  async function submitComment() {
    if (!task || !newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const { comment } = await tasks.addComment(task.id, { content: newComment, is_thinking: isThinking });
      setTask(prev => prev ? { ...prev, comments: [...(prev.comments ?? []), comment as unknown as TaskComment] } : null);
      setNewComment('');
    } finally {
      setSubmittingComment(false);
    }
  }

  async function startFlowSession(energy: number, flow: boolean) {
    if (!task) return;
    setStartingSession(true);
    try {
      const { session } = await tasks.startSession(task.id, { energy_level_start: energy, flow_mode: flow });
      setTask(prev => prev ? { ...prev, active_session: session, status: 'in_progress' } : null);
      setEnergyModal(false);
    } finally {
      setStartingSession(false);
    }
  }

  async function deleteTask() {
    if (!task || !window.confirm('¿Está seguro que desea eliminar esta tarea? No se puede deshacer.')) return;
    try {
      await tasks.delete(task.id);
      router.push('/tasks');
    } catch (err) {
      alert('Error al eliminar la tarea');
    }
  }

  if (loading) return <div className="flex items-center justify-center h-full text-text-3">Cargando tarea...</div>;
  if (!task) return <div className="flex items-center justify-center h-full text-text-3">Tarea no encontrada</div>;

  const dodCompleted = task.definition_of_done.filter(d => d.done).length;
  const dodTotal = task.definition_of_done.length;
  const canMarkDone = dodTotal === 0 || dodCompleted === dodTotal;

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-text-3 mb-5">
          <button onClick={() => router.back()} className="hover:text-text-1">← Volver</button>
          <span>/</span>
          <span className="text-text-2">{task.project_name ?? 'Proyecto'}</span>
          {task.sprint_name && <><span>/</span><span className="text-text-2">{task.sprint_name}</span></>}
        </div>

        <div className="flex gap-5">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            {editTitle ? (
              <textarea
                className="textarea text-lg font-bold w-full mb-3"
                defaultValue={task.title}
                autoFocus
                rows={2}
                onBlur={e => { updateField('title', e.target.value); setEditTitle(false); }}
              />
            ) : (
              <h1 className="text-xl font-bold text-text-0 leading-snug mb-3 cursor-text hover:bg-bg-3 rounded-lg px-2 py-1 -mx-2 transition-colors"
                onClick={() => setEditTitle(true)}>
                {task.title}
              </h1>
            )}

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-5">
              <span className={`badge ${COGNITIVE_TYPE_BG[task.cognitive_type]}`}>{COGNITIVE_TYPE_LABELS[task.cognitive_type]}</span>
              <span className={`badge ${PRIORITY_COLORS[task.priority]}`}>{PRIORITY_LABELS[task.priority]}</span>
              <span className={`badge ${TASK_STATUS_BG[task.status]}`}>{TASK_STATUS_LABELS[task.status]}</span>
              <span className={`badge border font-mono ${getPCCClass(task.cognitive_points)}`}>PCC {task.cognitive_points}</span>
              {task.task_type && <span className="badge bg-bg-4 text-text-2 border-border capitalize">{task.task_type}</span>}
            </div>

            {/* Strategic context */}
            <div className="bg-teal-dark/6 border border-teal-dark/20 border-l-2 border-l-teal-dark rounded-xl p-4 mb-5">
              <div className="text-[10px] font-semibold text-text-3 uppercase tracking-wider mb-2">Contexto Estratégico</div>
              <textarea
                className="textarea bg-transparent border-0 p-0 w-full text-xs text-text-1 leading-relaxed resize-none"
                rows={2}
                value={task.strategic_context || ''}
                onChange={e => updateField('strategic_context', e.target.value || null)}
                placeholder="Añade contexto estratégico... (click para editar)"
              />
            </div>

            {/* Description */}
            <>
              <div className="text-[10px] font-semibold text-text-3 uppercase tracking-wider mb-2">Descripción</div>
              <div className="text-sm text-text-1 leading-relaxed mb-5 bg-bg-2 border border-border rounded-xl p-4 focus-within:border-border-hi transition-colors">
                <textarea
                  className="textarea bg-transparent border-0 p-0 w-full resize-none"
                  rows={4}
                  value={task.description || ''}
                  onChange={e => updateField('description', e.target.value || null)}
                  placeholder="Añade una descripción... (Markdown soportado)"
                />
              </div>
            </>

            {/* Definition of Done */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[10px] font-semibold text-text-3 uppercase tracking-wider">Definition of Done</div>
                <span className="text-xs font-mono text-text-2">{dodCompleted}/{dodTotal}</span>
              </div>
              <div className="bg-bg-2 border border-border rounded-xl overflow-hidden">
                {task.definition_of_done && task.definition_of_done.length > 0 ? (
                  <>
                    {task.definition_of_done.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 px-4 py-3 border-b border-border last:border-0 hover:bg-bg-3 transition-colors group">
                        <button
                          onClick={() => toggleDoD(i)}
                          className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
                            item.done ? 'bg-teal-dark border-teal-dark' : 'border-border-hi hover:border-teal-dark'
                          }`}
                          title="Toggle done"
                        >
                          {item.done && <span className="text-white text-[8px]">✓</span>}
                        </button>
                        <input
                          type="text"
                          className="input bg-transparent border-0 p-0 text-xs flex-1 focus:ring-0 focus:bg-bg-3"
                          value={item.text}
                          onChange={e => {
                            const newDoD = task.definition_of_done.map((d, idx) =>
                              idx === i ? { ...d, text: e.target.value } : d
                            );
                            updateField('definition_of_done', newDoD);
                          }}
                          placeholder="Criterio de aceptación..."
                        />
                        <button
                          onClick={() => {
                            const newDoD = task.definition_of_done.filter((_, idx) => idx !== i);
                            updateField('definition_of_done', newDoD);
                          }}
                          className="text-xs px-2 py-1 rounded text-red hover:bg-red/10 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          title="Eliminar"
                        >
                          🗑
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const newDoD = [...(task.definition_of_done || []), { text: '', done: false }];
                        updateField('definition_of_done', newDoD);
                      }}
                      className="w-full text-xs px-4 py-2 text-text-2 hover:bg-bg-3 transition-colors text-left"
                    >
                      + Añadir criterio
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => updateField('definition_of_done', [{ text: '', done: false }])}
                    className="w-full text-xs px-4 py-3 text-text-3 hover:bg-bg-3 transition-colors"
                  >
                    + Añadir Definition of Done
                  </button>
                )}
              </div>
              {task.definition_of_done && dodTotal > 0 && !canMarkDone && task.status !== 'done' && (
                <p className="text-[10px] text-amber mt-2">⚠️ Completa todos los criterios de aceptación para marcar como done</p>
              )}
            </div>

            {/* Sessions */}
            {task.sessions && task.sessions.length > 0 && (
              <div className="mb-5">
                <div className="text-[10px] font-semibold text-text-3 uppercase tracking-wider mb-3">Sesiones de Trabajo</div>
                <div className="bg-bg-2 border border-border rounded-xl overflow-hidden">
                  {task.sessions.map((s, i) => (
                    <div key={s.id ?? i} className="flex items-start gap-3 px-4 py-3 border-b border-border last:border-0">
                      <div className="w-6 h-6 rounded-full bg-purple/20 flex items-center justify-center text-[9px] font-bold text-purple flex-shrink-0 mt-0.5">
                        {getInitials(s.full_name ?? 'U')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-text-0">{s.full_name}</span>
                          {s.flow_mode && <span className="text-[9px] bg-teal-dark/15 text-teal-dark border border-teal-dark/30 rounded px-1.5 py-0.5">🛡 Flujo</span>}
                        </div>
                        <div className="text-[10px] text-text-3 mt-0.5">
                          {formatDateTime(s.started_at)} · {formatDuration(s.started_at, s.ended_at)}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] text-text-3">Energía</span>
                            <div className="flex gap-0.5">{[1,2,3,4,5].map(n => <div key={n} className={`w-2 h-1 rounded-sm ${n <= (s.energy_level_start ?? 0) ? 'bg-teal-dark' : 'bg-bg-4'}`}/>)}</div>
                          </div>
                          {s.quality_rating && (
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] text-text-3">Calidad</span>
                              <div className="flex gap-0.5">{[1,2,3,4,5].map(n => <div key={n} className={`w-2 h-1 rounded-sm ${n <= s.quality_rating! ? 'bg-amber' : 'bg-bg-4'}`}/>)}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            <div>
              <div className="text-[10px] font-semibold text-text-3 uppercase tracking-wider mb-3">Comentarios</div>
              {task.comments && task.comments.length > 0 && (
                <div className="space-y-3 mb-4">
                  {task.comments.map(c => (
                    <div key={c.id} className={`p-3 rounded-xl border text-xs ${c.is_thinking ? 'bg-amber/5 border-amber/20 border-l-2 border-l-amber' : 'bg-bg-2 border-border'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 rounded-full bg-purple/20 flex items-center justify-center text-[8px] font-bold text-purple">
                          {getInitials(c.author_name)}
                        </div>
                        <span className="font-semibold text-text-0">{c.author_name}</span>
                        {c.is_thinking && <span className="text-[9px] text-amber bg-amber/10 px-1.5 rounded">💭 En voz alta</span>}
                        <span className="text-text-3 ml-auto text-[10px]">{formatDateTime(c.created_at)}</span>
                      </div>
                      <p className="text-text-1 leading-relaxed">{c.content}</p>
                    </div>
                  ))}
                </div>
              )}
              {/* Comment input */}
              <div className="bg-bg-2 border border-border rounded-xl p-3">
                <textarea
                  className="textarea bg-transparent border-0 p-0 mb-2 focus:ring-0"
                  rows={3}
                  placeholder="Añade un comentario... Markdown soportado"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-text-2 cursor-pointer">
                    <input type="checkbox" checked={isThinking} onChange={e => setIsThinking(e.target.checked)} className="accent-amber" />
                    <span>💭 Pensamiento en voz alta</span>
                  </label>
                  <button
                    className="btn btn-primary text-xs"
                    onClick={submitComment}
                    disabled={!newComment.trim() || submittingComment}
                  >
                    {submittingComment ? 'Enviando...' : 'Comentar'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-[240px] flex-shrink-0 space-y-3">
            {/* Actions */}
            <button
              className={`btn w-full justify-center text-xs ${task.active_session ? 'btn-teal' : 'btn-primary'}`}
              onClick={() => !task.active_session && setEnergyModal(true)}
              disabled={startingSession}
            >
              {task.active_session ? '🛡 Sesión Activa' : '▶ Iniciar Sesión de Flujo'}
            </button>

            {!canMarkDone && task.status !== 'done' ? (
              <button className="btn btn-ghost w-full justify-center text-xs opacity-50 cursor-not-allowed" disabled>
                ✓ Marcar Done ({dodCompleted}/{dodTotal})
              </button>
            ) : task.status !== 'done' ? (
              <button className="btn btn-teal w-full justify-center text-xs" onClick={() => updateField('status', 'done')}>
                ✓ Marcar Done
              </button>
            ) : null}

            <button
              className="btn btn-ghost btn-error w-full justify-center text-xs opacity-70 hover:opacity-100"
              onClick={deleteTask}
            >
              🗑 Eliminar Tarea
            </button>

            {/* Metadata */}
            <div className="bg-bg-2 border border-border rounded-xl p-3 space-y-3">
              <div className="text-[10px] font-semibold text-text-3 uppercase tracking-wider mb-2">Configuración</div>
              
              <div>
                <label className="text-[10px] text-text-3 block mb-1">Estado</label>
                <select className="select text-xs w-full" value={task.status} onChange={e => updateField('status', e.target.value)}>
                  {(['backlog','todo','in_progress','review','blocked','done'] as const).map(s => <option key={s} value={s}>{TASK_STATUS_LABELS[s]}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-text-3 block mb-1">Tipo de Tarea</label>
                <select className="select text-xs w-full" value={task.task_type} onChange={e => updateField('task_type', e.target.value)}>
                  {(['implementation','research','spike','review','experiment','documentation','bug','refactor'] as const).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-text-3 block mb-1">Tipo Cognitivo</label>
                <select className="select text-xs w-full" value={task.cognitive_type} onChange={e => updateField('cognitive_type', e.target.value)}>
                  {(['deep_focus','creative','routine','collaborative','exploratory'] as const).map(c => <option key={c} value={c}>{COGNITIVE_TYPE_LABELS[c]}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-text-3 block mb-1">Prioridad</label>
                <select className="select text-xs w-full" value={task.priority} onChange={e => updateField('priority', e.target.value)}>
                  {(['critical','high','medium','low','someday'] as const).map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-text-3 block mb-1">PCC</label>
                <select className="select text-xs w-full font-mono" value={task.cognitive_points} onChange={e => updateField('cognitive_points', +e.target.value)}>
                  {PCC_VALUES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-text-3 block mb-1">Horas Estimadas</label>
                <input type="number" className="input text-xs w-full" min="0" step="0.5" value={task.estimated_hours || ''} 
                  onChange={e => updateField('estimated_hours', e.target.value ? +e.target.value : null)} placeholder="Ej: 2.5" />
              </div>

              <div>
                <label className="text-[10px] text-text-3 block mb-1">Razón Bloqueada</label>
                <input type="text" className="input text-xs w-full" value={task.blocked_reason || ''} 
                  onChange={e => updateField('blocked_reason', e.target.value || null)} placeholder="¿Por qué está bloqueada?" />
              </div>

              <div>
                <label className="text-[10px] text-text-3 block mb-1">Etiquetas</label>
                <input type="text" className="input text-xs w-full" value={task.tags?.join(', ') || ''} 
                  onChange={e => updateField('tags', e.target.value ? e.target.value.split(',').map(t => t.trim()) : [])} 
                  placeholder="Separadas por comas" />
              </div>

              <div className="pt-2 border-t border-border text-[10px] text-text-3 space-y-1">
                <div className="flex justify-between"><span>Creado:</span><span>{formatDateTime(task.created_at)}</span></div>
                <div className="flex justify-between"><span>Actualizado:</span><span>{formatDateTime(task.updated_at)}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Energy modal */}
      {energyModal && (
        <div className="fixed inset-0 bg-bg-0/80 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-2 border border-border rounded-2xl w-80 p-6 animate-slide-up">
            <h3 className="text-sm font-semibold text-text-0 mb-4">Iniciar Sesión de Trabajo</h3>
            <p className="text-xs text-text-2 mb-5">¿Cuál es tu nivel de energía cognitiva ahora mismo?</p>
            <div className="grid grid-cols-5 gap-2 mb-5">
              {[1,2,3,4,5].map(e => (
                <button key={e} className="btn btn-ghost flex-col py-3 text-center gap-1"
                  onClick={() => startFlowSession(e, e >= 4)}>
                  <span className="text-lg">{['😴','😑','🙂','😊','🔥'][e-1]}</span>
                  <span className="text-[9px] text-text-3">{e}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEnergyModal(false)} className="btn btn-ghost flex-1 justify-center text-xs">Cancelar</button>
              <button onClick={() => startFlowSession(4, true)} className="btn btn-teal flex-1 justify-center text-xs">
                🛡 Modo Flujo Directo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
