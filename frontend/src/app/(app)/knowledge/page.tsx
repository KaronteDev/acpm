'use client';
import { useEffect, useState } from 'react';
import { knowledge, projects } from '@/lib/api';
import type { KnowledgeNode, Project } from '@/lib/api';
import { formatDateTime, getInitials } from '@/lib/utils';

const NODE_TYPE_LABELS: Record<string, string> = {
  adr: '📐 ADR',
  lesson: '💡 Lección',
  pattern: '⬡ Patrón',
  decision: '⚖️ Decisión',
};

export default function KnowledgePage() {
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [filterType, setFilterType] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<KnowledgeNode | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    projects.list().then(r => {
      setProjectList(r.projects);
      if (r.projects.length) setSelectedProject(r.projects[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedProject) return;
    setLoading(true);
    knowledge.list({ project_id: selectedProject, ...(filterType ? { node_type: filterType } : {}) })
      .then(r => setNodes(r.nodes))
      .finally(() => setLoading(false));
  }, [selectedProject, filterType]);

  return (
    <div className="h-full flex overflow-hidden">
      {/* List */}
      <div className="flex-1 overflow-y-auto p-6 border-r border-border">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-text-0">Base de Conocimiento</h2>
            <p className="text-xs text-text-2 mt-1">Decisiones, patrones y lecciones aprendidas</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn btn-primary text-xs">+ Nuevo Nodo</button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          <select className="select w-48 text-xs" value={selectedProject} onChange={e => setSelectedProject(e.target.value)}>
            {projectList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {['', 'adr', 'lesson', 'pattern', 'decision'].map(t => (
            <button key={t} onClick={() => setFilterType(t)} className={`btn text-xs ${filterType === t ? 'btn-primary' : 'btn-ghost'}`}>
              {t ? NODE_TYPE_LABELS[t] : 'Todos'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-text-3">Cargando base de conocimiento...</div>
        ) : (
          <div className="space-y-3">
            {nodes.map(node => (
              <div
                key={node.id}
                onClick={() => setSelected(selected?.id === node.id ? null : node)}
                className={`card cursor-pointer hover:border-border-hi transition-all hover:-translate-y-0.5 ${selected?.id === node.id ? 'border-purple' : ''}`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0 mr-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-semibold bg-bg-4 px-2 py-0.5 rounded text-text-2">
                          {NODE_TYPE_LABELS[node.node_type] ?? node.node_type}
                        </span>
                        {node.tags?.slice(0, 3).map(t => (
                          <span key={t} className="text-[9px] font-mono bg-bg-4 text-text-3 px-1.5 py-0.5 rounded">{t}</span>
                        ))}
                      </div>
                      <h3 className="text-sm font-semibold text-text-0">{node.title}</h3>
                    </div>
                  </div>
                  <p className="text-xs text-text-2 line-clamp-2 leading-relaxed">{node.content}</p>
                  <div className="flex items-center justify-between mt-3 text-[10px] text-text-3">
                    <span>{node.author_name ?? 'Sistema'}</span>
                    <span>{formatDateTime(node.updated_at)}</span>
                  </div>
                </div>
              </div>
            ))}
            {nodes.length === 0 && (
              <div className="text-center py-16">
                <div className="text-3xl mb-3">◉</div>
                <p className="text-text-2 text-sm">No hay nodos de conocimiento aún</p>
                <button onClick={() => setShowCreate(true)} className="btn btn-primary text-xs mt-4">Crear primer nodo</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="w-[380px] flex-shrink-0 overflow-y-auto p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-semibold bg-bg-3 px-2 py-1 rounded text-text-2">
              {NODE_TYPE_LABELS[selected.node_type] ?? selected.node_type}
            </span>
            <button onClick={() => setSelected(null)} className="text-text-3 hover:text-text-1">✕</button>
          </div>
          <h3 className="text-base font-bold text-text-0 mb-3">{selected.title}</h3>
          {selected.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {selected.tags.map(t => <span key={t} className="text-[9px] font-mono bg-bg-4 text-text-2 px-1.5 py-0.5 rounded">{t}</span>)}
            </div>
          )}
          <div className="text-sm text-text-1 leading-relaxed whitespace-pre-wrap bg-bg-2 border border-border rounded-xl p-4">
            {selected.content}
          </div>
          <div className="mt-4 text-xs text-text-3 space-y-1">
            <div>Autor: <span className="text-text-2">{selected.author_name ?? 'Sistema'}</span></div>
            <div>Actualizado: <span className="text-text-2">{formatDateTime(selected.updated_at)}</span></div>
          </div>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <CreateNodeModal
          projectId={selectedProject}
          onClose={() => setShowCreate(false)}
          onCreated={node => { setNodes(prev => [node, ...prev]); setShowCreate(false); setSelected(node); }}
        />
      )}
    </div>
  );
}

function CreateNodeModal({ projectId, onClose, onCreated }: {
  projectId: string;
  onClose: () => void;
  onCreated: (n: KnowledgeNode) => void;
}) {
  const [form, setForm] = useState({ title: '', content: '', node_type: 'lesson', tags: '' });
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { node } = await knowledge.create({
        project_id: projectId,
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
      });
      onCreated(node);
    } finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-bg-0/80 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-2 border border-border rounded-2xl w-full max-w-lg shadow-xl animate-slide-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-base font-semibold text-text-0">Nuevo Nodo de Conocimiento</h3>
          <button onClick={onClose} className="text-text-3 hover:text-text-1">✕</button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-text-2 mb-1.5">Tipo</label>
            <select className="select" value={form.node_type} onChange={e => setForm(f => ({ ...f, node_type: e.target.value }))}>
              {Object.entries(NODE_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-2 mb-1.5">Título *</label>
            <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="ADR-002: Elección de motor de embeddings" />
          </div>
          <div>
            <label className="block text-xs text-text-2 mb-1.5">Contenido *</label>
            <textarea className="textarea" rows={6} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} required placeholder="Contexto, decisión tomada, alternativas consideradas..." />
          </div>
          <div>
            <label className="block text-xs text-text-2 mb-1.5">Etiquetas</label>
            <input className="input" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="architecture, decision, AI" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-ghost flex-1 justify-center">Cancelar</button>
            <button type="submit" disabled={loading} className="btn btn-primary flex-1 justify-center">{loading ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
