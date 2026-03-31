'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { projects } from '@/lib/api';
import type { Project } from '@/lib/api';
import { formatDate } from '@/lib/utils';

const METHODOLOGY_LABELS: Record<string, string> = {
  kanban_aacc: 'Kanban AACC',
  adaptive_sprint: 'Sprint Adaptado',
  async_deep: 'Async Deep',
  hybrid: 'Híbrido',
};

const TYPE_LABELS: Record<string, string> = {
  exploration: 'Exploración',
  delivery: 'Entrega',
  research: 'Investigación',
  maintenance: 'Mantenimiento',
  innovation: 'Innovación',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador', active: 'Activo', paused: 'Pausado', completed: 'Completado', archived: 'Archivado',
};

export default function ProjectsPage() {
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState('active');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    setLoading(true);
    projects.list(filter !== 'all' ? { status: filter } : undefined)
      .then(r => setAllProjects(r.projects))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-text-0">Proyectos</h2>
          <p className="text-xs text-text-2 mt-1">{allProjects.length} proyecto(s) encontrado(s)</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary text-xs">+ Nuevo Proyecto</button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5">
        {[['all','Todos'], ['active','Activos'], ['paused','Pausados'], ['completed','Completados']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)} className={`btn text-xs ${filter === val ? 'btn-primary' : 'btn-ghost'}`}>{label}</button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-text-3">Cargando proyectos...</div>
      ) : allProjects.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">◈</div>
          <p className="text-text-2">No hay proyectos en esta vista</p>
          <button onClick={() => setShowCreate(true)} className="btn btn-primary text-xs mt-4">Crear primer proyecto</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {allProjects.map(p => (
            <Link key={p.id} href={`/projects/${p.id}`}>
              <div className="card hover:border-border-hi transition-all hover:-translate-y-0.5 cursor-pointer group">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 mr-3">
                      <h3 className="text-sm font-semibold text-text-0 group-hover:text-purple transition-colors leading-snug">{p.name}</h3>
                      <p className="text-xs text-text-3 mt-1 line-clamp-2">{p.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        (p.progress ?? 0) > 75 ? 'bg-teal-dark shadow-[0_0_6px_#1D9E75]' :
                        (p.progress ?? 0) > 30 ? 'bg-amber shadow-[0_0_6px_#EF9F27]' :
                        'bg-purple shadow-[0_0_6px_#7F77DD]'
                      }`} />
                    </div>
                  </div>

                  {/* Tags */}
                  {p.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {p.tags.slice(0, 4).map(tag => (
                        <span key={tag} className="text-[9px] font-mono bg-bg-4 text-text-3 px-1.5 py-0.5 rounded">{tag}</span>
                      ))}
                    </div>
                  )}

                  {/* Progress */}
                  <div className="bg-bg-4 rounded-full h-1 mb-2">
                    <div className="h-1 rounded-full bg-gradient-to-r from-purple to-teal-dark transition-all" style={{ width: `${p.progress ?? 0}%` }} />
                  </div>

                  {/* Meta */}
                  <div className="flex items-center justify-between text-[10px] text-text-3">
                    <span className="flex items-center gap-2">
                      <span className="bg-bg-4 px-1.5 py-0.5 rounded">{TYPE_LABELS[p.project_type] ?? p.project_type}</span>
                      <span className="bg-bg-4 px-1.5 py-0.5 rounded">{METHODOLOGY_LABELS[p.methodology] ?? p.methodology}</span>
                    </span>
                    <span>{p.progress ?? 0}% · {p.task_count ?? 0} tareas</span>
                  </div>

                  {/* CC indicator */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                    <span className="text-[10px] text-text-3">Complejidad cognitiva</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className={`w-2 h-1.5 rounded-sm ${i < p.cognitive_complexity ? 'bg-purple' : 'bg-bg-4'}`} />
                      ))}
                    </div>
                    <span className="text-[10px] font-mono text-purple">{p.cognitive_complexity}/10</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} onCreated={p => { setAllProjects(prev => [p, ...prev]); setShowCreate(false); }} />}
    </div>
  );
}

function CreateProjectModal({ onClose, onCreated }: { onClose: () => void; onCreated: (p: Project) => void }) {
  const [form, setForm] = useState({
    name: '', description: '', project_type: 'delivery', methodology: 'adaptive_sprint', cognitive_complexity: 5, tags: '',
  });
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { project } = await projects.create({
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
      });
      onCreated(project);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-bg-0/80 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-2 border border-border rounded-2xl w-full max-w-lg shadow-xl animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-base font-semibold text-text-0">Nuevo Proyecto</h3>
          <button onClick={onClose} className="text-text-3 hover:text-text-1">✕</button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-text-2 mb-1.5">Nombre del proyecto *</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Motor de IA Cognitiva" />
          </div>
          <div>
            <label className="block text-xs text-text-2 mb-1.5">Descripción</label>
            <textarea className="textarea" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Contexto y objetivo del proyecto..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-2 mb-1.5">Tipo</label>
              <select className="select" value={form.project_type} onChange={e => setForm(f => ({ ...f, project_type: e.target.value }))}>
                {Object.entries(TYPE_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-2 mb-1.5">Metodología</label>
              <select className="select" value={form.methodology} onChange={e => setForm(f => ({ ...f, methodology: e.target.value }))}>
                {Object.entries(METHODOLOGY_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-text-2 mb-1.5">Complejidad cognitiva: {form.cognitive_complexity}/10</label>
            <input type="range" min="1" max="10" value={form.cognitive_complexity} onChange={e => setForm(f => ({ ...f, cognitive_complexity: +e.target.value }))} className="w-full accent-purple" />
          </div>
          <div>
            <label className="block text-xs text-text-2 mb-1.5">Etiquetas (separadas por coma)</label>
            <input className="input" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="AI, TypeScript, PostgreSQL" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-ghost flex-1 justify-center">Cancelar</button>
            <button type="submit" disabled={loading} className="btn btn-primary flex-1 justify-center">
              {loading ? 'Creando...' : 'Crear Proyecto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
