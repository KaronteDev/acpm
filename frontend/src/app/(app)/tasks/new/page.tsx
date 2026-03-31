'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { tasks, projects, sprints, users } from '@/lib/api';
import type { Project, Sprint, User } from '@/lib/api';
import { COGNITIVE_TYPE_LABELS, PCC_VALUES } from '@/lib/utils';

export default function NewTaskPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [sprintList, setSprintList] = useState<Sprint[]>([]);
  const [userList, setUserList] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    project_id: params.get('project') ?? '',
    sprint_id: '',
    title: '',
    description: '',
    task_type: 'implementation',
    cognitive_type: 'deep_focus',
    priority: 'medium',
    cognitive_points: 3,
    assignee_id: '',
    strategic_context: '',
    tags: '',
    dod: [{ text: '', done: false }],
  });

  useEffect(() => {
    Promise.all([projects.list(), users.list()]).then(([p, u]) => {
      setProjectList(p.projects);
      setUserList(u.users);
      if (!form.project_id && p.projects.length) setForm(f => ({ ...f, project_id: p.projects[0].id }));
    });
  }, []);

  useEffect(() => {
    if (!form.project_id) return;
    sprints.list({ project_id: form.project_id, status: 'active' })
      .then(r => setSprintList(r.sprints)).catch(() => {});
  }, [form.project_id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { task } = await tasks.create({
        project_id: form.project_id,
        sprint_id: form.sprint_id || undefined,
        title: form.title,
        description: form.description || undefined,
        task_type: form.task_type as never,
        cognitive_type: form.cognitive_type as never,
        priority: form.priority as never,
        cognitive_points: form.cognitive_points,
        assignee_id: form.assignee_id || undefined,
        strategic_context: form.strategic_context || undefined,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        definition_of_done: form.dod.filter(d => d.text.trim()),
      });
      router.push(`/tasks/${task.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al crear la tarea');
    } finally {
      setLoading(false);
    }
  }

  function addDod() { setForm(f => ({ ...f, dod: [...f.dod, { text: '', done: false }] })); }
  function removeDod(i: number) { setForm(f => ({ ...f, dod: f.dod.filter((_, j) => j !== i) })); }
  function updateDod(i: number, text: string) { setForm(f => ({ ...f, dod: f.dod.map((d, j) => j === i ? { ...d, text } : d) })); }

  const needsContext = form.cognitive_points >= 5;

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-text-3 hover:text-text-1 text-sm">←</button>
          <h2 className="text-xl font-bold text-text-0">Nueva Tarea</h2>
        </div>

        <form onSubmit={submit} className="space-y-5">
          {/* Project & Sprint */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-2 mb-1.5">Proyecto *</label>
              <select className="select" value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}>
                <option value="">— Selecciona proyecto —</option>
                {projectList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-2 mb-1.5">Sprint</label>
              <select className="select" value={form.sprint_id} onChange={e => setForm(f => ({ ...f, sprint_id: e.target.value }))}>
                <option value="">— Sin sprint (backlog/exploración) —</option>
                {sprintList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs text-text-2 mb-1.5">Título *</label>
            <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="Describe la tarea con precisión..." />
          </div>

          {/* Type & Cognitive type */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-text-2 mb-1.5">Tipo de tarea</label>
              <select className="select" value={form.task_type} onChange={e => setForm(f => ({ ...f, task_type: e.target.value }))}>
                {['implementation','research','spike','review','experiment','documentation','bug','refactor'].map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-2 mb-1.5">Tipo cognitivo</label>
              <select className="select" value={form.cognitive_type} onChange={e => setForm(f => ({ ...f, cognitive_type: e.target.value }))}>
                {(Object.entries(COGNITIVE_TYPE_LABELS) as [string, string][]).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-2 mb-1.5">Prioridad</label>
              <select className="select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                {[['critical','⚡ Crítica'],['high','⬆ Alta'],['medium','→ Media'],['low','⬇ Baja'],['someday','◌ Algún día']].map(([v,l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          {/* PCC selector */}
          <div>
            <label className="block text-xs text-text-2 mb-2">Puntos de Complejidad Cognitiva (PCC) — Fibonacci</label>
            <div className="flex gap-2">
              {PCC_VALUES.map(v => (
                <button type="button" key={v} onClick={() => setForm(f => ({ ...f, cognitive_points: v }))}
                  className={`btn font-mono text-sm w-10 h-10 justify-center ${form.cognitive_points === v ? 'btn-primary' : 'btn-ghost'}`}>
                  {v}
                </button>
              ))}
            </div>
            {needsContext && (
              <p className="text-xs text-amber mt-2">⚠️ PCC ≥ 5: el campo &quot;Contexto Estratégico&quot; es obligatorio para perfiles AACC</p>
            )}
          </div>

          {/* Strategic context */}
          <div>
            <label className="block text-xs text-text-2 mb-1.5">
              Contexto Estratégico{needsContext ? ' *' : ''}
              <span className="ml-2 text-text-3 font-normal">El &quot;para qué&quot; de esta tarea</span>
            </label>
            <textarea className="textarea" rows={2} value={form.strategic_context}
              onChange={e => setForm(f => ({ ...f, strategic_context: e.target.value }))}
              required={needsContext}
              placeholder="¿Por qué es importante esta tarea? ¿Qué impacto tiene en el producto o equipo?" />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-text-2 mb-1.5">Descripción <span className="text-text-3 font-normal">— Markdown soportado</span></label>
            <textarea className="textarea" rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe el alcance técnico, criterios de aceptación, referencias..." />
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-xs text-text-2 mb-1.5">Asignar a</label>
            <select className="select" value={form.assignee_id} onChange={e => setForm(f => ({ ...f, assignee_id: e.target.value }))}>
              <option value="">— Sin asignar —</option>
              {userList.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
            </select>
          </div>

          {/* DoD */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-text-2">Definition of Done</label>
              <button type="button" onClick={addDod} className="text-xs text-purple hover:text-purple-light">+ Añadir criterio</button>
            </div>
            <div className="space-y-2">
              {form.dod.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded border border-border flex-shrink-0" />
                  <input className="input flex-1" value={d.text} onChange={e => updateDod(i, e.target.value)} placeholder={`Criterio ${i + 1}...`} />
                  {form.dod.length > 1 && (
                    <button type="button" onClick={() => removeDod(i)} className="text-text-3 hover:text-red text-sm">✕</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs text-text-2 mb-1.5">Etiquetas</label>
            <input className="input" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="TypeScript, PostgreSQL, Auth" />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2 border-t border-border">
            <button type="button" onClick={() => router.back()} className="btn btn-ghost flex-1 justify-center">Cancelar</button>
            <button type="submit" disabled={loading} className="btn btn-primary flex-1 justify-center text-sm">
              {loading ? 'Creando tarea...' : 'Crear Tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
