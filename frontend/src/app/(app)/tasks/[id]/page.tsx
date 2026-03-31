'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { tasks, users } from '@/lib/api';
import type { Task, User, DoD, CognitiveSession, TaskComment } from '@/lib/api';
import {
  COGNITIVE_TYPE_LABELS, COGNITIVE_TYPE_BG, TASK_STATUS_BG, TASK_STATUS_LABELS,
  PRIORITY_LABELS, PRIORITY_COLORS, getPCCClass, formatDateTime, formatDuration, getInitials, PCC_VALUES
} from '@/lib/utils';
import { useAuthStore } from '@/lib/store';
import { ConfirmDialog } from '@/components/ConfirmDialog';

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
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [assigneeSearchOpen, setAssigneeSearchOpen] = useState(false);
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState('');
  const [mentionUsers, setMentionUsers] = useState<Awaited<ReturnType<typeof users.search>>['users']>([]);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [mentionStartIndex, setMentionStartIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState<{ [id: string]: string }>({});
  const [editMentionUsers, setEditMentionUsers] = useState<Awaited<ReturnType<typeof users.search>>['users']>([]);
  const [showEditMentionMenu, setShowEditMentionMenu] = useState(false);
  const [editMentionQuery, setEditMentionQuery] = useState('');
  const [editSelectedMentionIndex, setEditSelectedMentionIndex] = useState(0);
  const [editMentionStartIndex, setEditMentionStartIndex] = useState(0);
  const [editCommentInputRef, setEditCommentInputRef] = useState<HTMLTextAreaElement | null>(null);
  const [editCommentSubmitting, setEditCommentSubmitting] = useState(false);
  const [editReasons, setEditReasons] = useState<{ [id: string]: string }>({});
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);
  const [editHistoryCommentId, setEditHistoryCommentId] = useState<string | null>(null);
  const [commentEdits, setCommentEdits] = useState<{ [id: string]: any }>({});
  const [loadingEdits, setLoadingEdits] = useState(false);
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    tasks.get(id).then(r => setTask(r.task)).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  // Load available users for assignment
  useEffect(() => {
    users.list().then(r => setAvailableUsers(r.users)).catch(() => {});
  }, []);

  // Extract comment ID from hash and scroll to it
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#comment-')) {
        const commentId = hash.slice(9); // Remove '#comment-'
        setHighlightedCommentId(commentId);
        
        // Wait for DOM to be ready
        setTimeout(() => {
          const element = document.getElementById(`comment-${commentId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Remove highlight after 3 seconds
            setTimeout(() => setHighlightedCommentId(null), 3000);
          }
        }, 200);
      }
    };

    // Check on initial load
    handleHashChange();
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

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
      setShowMentionMenu(false);
    } finally {
      setSubmittingComment(false);
    }
  }

  async function handleCommentChange(value: string) {
    setNewComment(value);
    
    // Detect @mentions - permite espacios en nombres
    const lastAtIndex = value.lastIndexOf('@');
    
    if (lastAtIndex > -1) {
      // Busca caracteres que terminan la mención
      const afterAt = value.slice(lastAtIndex + 1);
      const stopChars = [',', '.', '\n', ':'];
      const stopIndex = Math.min(
        ...stopChars.map(c => {
          const idx = afterAt.indexOf(c);
          return idx === -1 ? afterAt.length : idx;
        })
      );
      const query = afterAt.slice(0, stopIndex).trim();
      
      if (query.length >= 2) {
        setMentionQuery(query);
        setMentionStartIndex(lastAtIndex);
        setSelectedMentionIndex(0);
        setShowMentionMenu(true);
        
        try {
          const { users: foundUsers } = await users.search(query);
          setMentionUsers(foundUsers);
        } catch {
          setMentionUsers([]);
        }
      } else if (query.length < 2) {
        setShowMentionMenu(false);
      }
    } else {
      setShowMentionMenu(false);
    }
  }

  function insertMention(user: User) {
    const before = newComment.slice(0, mentionStartIndex);
    const after = newComment.slice(mentionStartIndex + mentionQuery.length + 1);
    const newText = `${before}@${user.full_name} ${after}`;
    setNewComment(newText);
    setShowMentionMenu(false);
    
    // Posicionar cursor después del nombre
    setTimeout(() => {
      if (commentInputRef.current) {
        const cursorPos = mentionStartIndex + user.full_name.length + 2;
        commentInputRef.current.setSelectionRange(cursorPos, cursorPos);
        commentInputRef.current.focus();
      }
    }, 0);
  }

  function handleMentionKeyDown(e: React.KeyboardEvent) {
    if (!showMentionMenu || mentionUsers.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedMentionIndex(prev => (prev + 1) % mentionUsers.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedMentionIndex(prev => (prev - 1 + mentionUsers.length) % mentionUsers.length);
        break;
      case 'Enter':
        if (showMentionMenu) {
          e.preventDefault();
          insertMention(mentionUsers[selectedMentionIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowMentionMenu(false);
        break;
    }
  }

  function renderCommentContent(content: string) {
    // Highlight mentions
    const parts = content.split(/(@\w+)/);
    return parts.map((part, i) => 
      part.startsWith('@') ? (
        <span key={i} className="font-semibold text-teal-dark bg-teal-dark/10 px-1 rounded">
          {part}
        </span>
      ) : (
        part
      )
    );
  }

  function startEditingComment(commentId: string, content: string) {
    setEditingCommentId(commentId);
    setEditCommentContent({ [commentId]: content });
  }

  function cancelEditingComment() {
    setEditingCommentId(null);
    setEditCommentContent({});
    setEditReasons({});
    setShowEditMentionMenu(false);
  }

  async function handleEditCommentChange(commentId: string, value: string) {
    setEditCommentContent(prev => ({ ...prev, [commentId]: value }));
    
    // Detect @mentions - permite espacios en nombres
    const lastAtIndex = value.lastIndexOf('@');
    
    if (lastAtIndex > -1) {
      const afterAt = value.slice(lastAtIndex + 1);
      const stopChars = [',', '.', '\n', ':'];
      const stopIndex = Math.min(
        ...stopChars.map(c => {
          const idx = afterAt.indexOf(c);
          return idx === -1 ? afterAt.length : idx;
        })
      );
      const query = afterAt.slice(0, stopIndex).trim();
      
      if (query.length >= 2) {
        setEditMentionQuery(query);
        setEditMentionStartIndex(lastAtIndex);
        setEditSelectedMentionIndex(0);
        setShowEditMentionMenu(true);
        
        try {
          const { users: foundUsers } = await users.search(query);
          setEditMentionUsers(foundUsers);
        } catch {
          setEditMentionUsers([]);
        }
      } else if (query.length < 2) {
        setShowEditMentionMenu(false);
      }
    } else {
      setShowEditMentionMenu(false);
    }
  }

  function handleEditMentionKeyDown(e: React.KeyboardEvent) {
    if (!showEditMentionMenu || editMentionUsers.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setEditSelectedMentionIndex(prev => (prev + 1) % editMentionUsers.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setEditSelectedMentionIndex(prev => (prev - 1 + editMentionUsers.length) % editMentionUsers.length);
        break;
      case 'Enter':
        if (showEditMentionMenu) {
          e.preventDefault();
          insertEditMention(editMentionUsers[editSelectedMentionIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowEditMentionMenu(false);
        break;
    }
  }

  function insertEditMention(user: User) {
    if (!editingCommentId) return;
    const currentContent = editCommentContent[editingCommentId] || '';
    const before = currentContent.slice(0, editMentionStartIndex);
    const after = currentContent.slice(editMentionStartIndex + editMentionQuery.length + 1);
    const newText = `${before}@${user.full_name} ${after}`;
    setEditCommentContent(prev => ({ ...prev, [editingCommentId]: newText }));
    setShowEditMentionMenu(false);
    
    // Posicionar cursor después del nombre
    setTimeout(() => {
      if (editCommentInputRef) {
        const cursorPos = editMentionStartIndex + user.full_name.length + 2;
        editCommentInputRef.setSelectionRange(cursorPos, cursorPos);
        editCommentInputRef.focus();
      }
    }, 0);
  }

  async function saveEditedComment(commentId: string) {
    if (!task || !editCommentContent[commentId]?.trim()) return;
    setEditCommentSubmitting(true);
    try {
      const { comment } = await tasks.updateComment(task.id, commentId, { 
        content: editCommentContent[commentId],
        reason: editReasons[commentId] || undefined
      });
      setTask(prev => {
        if (!prev) return null;
        return {
          ...prev,
          comments: prev.comments?.map(c => c.id === commentId ? comment as unknown as TaskComment : c) ?? []
        };
      });
      setEditingCommentId(null);
      setEditCommentContent({});
      setEditReasons({});
      setShowEditMentionMenu(false);
    } catch (err) {
      alert('Error al guardar el comentario');
    } finally {
      setEditCommentSubmitting(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!task) return;
    try {
      await tasks.deleteComment(task.id, commentId);
      setTask(prev => {
        if (!prev) return null;
        return {
          ...prev,
          comments: prev.comments?.filter(c => c.id !== commentId) ?? []
        };
      });
      setDeleteCommentId(null);
    } catch (err) {
      alert('Error al eliminar el comentario');
    }
  }

  async function loadCommentEdits(commentId: string) {
    if (!task) return;
    setLoadingEdits(true);
    try {
      const result = await tasks.getCommentEdits(task.id, commentId);
      setCommentEdits(prev => ({ ...prev, [commentId]: result }));
      setEditHistoryCommentId(commentId);
    } catch (err) {
      alert('Error al cargar el historial');
    } finally {
      setLoadingEdits(false);
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

  async function handleDeleteTask() {
    if (!task) return;
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
                    <div key={c.id} id={`comment-${c.id}`} className={`p-3 rounded-xl border text-xs transition-all ${
                      highlightedCommentId === c.id 
                        ? 'bg-yellow/20 border-yellow ring-2 ring-yellow/50 shadow-lg' 
                        : c.is_thinking ? 'bg-amber/5 border-amber/20 border-l-2 border-l-amber' : 'bg-bg-2 border-border'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 rounded-full bg-purple/20 flex items-center justify-center text-[8px] font-bold text-purple">
                          {getInitials(c.author_name)}
                        </div>
                        <span className="font-semibold text-text-0">{c.author_name}</span>
                        {c.is_thinking && <span className="text-[9px] text-amber bg-amber/10 px-1.5 rounded">💭 En voz alta</span>}
                        {c.edit_count > 0 && (
                          <button
                            onClick={() => loadCommentEdits(c.id)}
                            className="text-[9px] text-text-3 hover:text-text-1 underline cursor-pointer"
                            title={`Editado ${c.edit_count} vez${c.edit_count > 1 ? 'es' : ''}`}
                          >
                            Editado
                          </button>
                        )}
                        <span className="text-text-3 ml-auto text-[10px]">{formatDateTime(c.created_at)}</span>
                        {currentUser?.id === c.author_id && (
                          <div className="flex items-center gap-1">
                            {editingCommentId !== c.id && (
                              <>
                                <button
                                  onClick={() => startEditingComment(c.id, c.content)}
                                  className="px-1.5 py-0.5 text-[9px] text-purple hover:bg-purple/10 rounded transition-colors"
                                  title="Editar"
                                >
                                  ✎
                                </button>
                                <button
                                  onClick={() => setDeleteCommentId(c.id)}
                                  className="px-1.5 py-0.5 text-[9px] text-red hover:bg-red/10 rounded transition-colors"
                                  title="Eliminar"
                                >
                                  🗑
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      {editingCommentId === c.id ? (
                        <div className="relative">
                          <textarea
                            ref={el => { if (el) setEditCommentInputRef(el); }}
                            className="textarea bg-transparent border border-purple/30 p-2 mb-2 focus:ring-purple/50 w-full"
                            rows={3}
                            value={editCommentContent[c.id] || ''}
                            onChange={e => handleEditCommentChange(c.id, e.target.value)}
                            onKeyDown={handleEditMentionKeyDown}
                          />
                          
                          {/* Edit mention autocomplete */}
                          {showEditMentionMenu && editMentionUsers.length > 0 && (
                            <div className="absolute bottom-full left-2 right-2 mb-1 bg-bg-3 border border-border rounded-lg overflow-hidden shadow-lg z-50">
                              {editMentionUsers.map((user, idx) => (
                                <button
                                  key={user.id}
                                  className={`w-full text-left px-3 py-2 transition-colors flex items-center gap-2 text-xs ${
                                    idx === editSelectedMentionIndex ? 'bg-purple/30 border-l-2 border-l-purple' : 'hover:bg-bg-4'
                                  }`}
                                  onClick={() => insertEditMention(user)}
                                >
                                  <div className="w-4 h-4 rounded-full bg-purple/20 flex items-center justify-center text-[7px] font-bold text-purple"></div>
                                  <span className="font-semibold text-text-1">{user.full_name}</span>
                                  <span className="text-text-3 text-[9px]">{user.email}</span>
                                </button>
                              ))}
                            </div>
                          )}
                          
                          <div className="mb-2">
                            <input
                              type="text"
                              className="input text-xs w-full"
                              placeholder="Razón de la edición (opcional)"
                              value={editReasons[c.id] || ''}
                              onChange={e => setEditReasons(prev => ({ ...prev, [c.id]: e.target.value }))}
                              disabled={editCommentSubmitting}
                            />
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              className="btn btn-primary text-xs"
                              onClick={() => saveEditedComment(c.id)}
                              disabled={editCommentSubmitting}
                            >
                              {editCommentSubmitting ? 'Guardando...' : 'Guardar'}
                            </button>
                            <button
                              className="btn btn-ghost text-xs"
                              onClick={cancelEditingComment}
                              disabled={editCommentSubmitting}
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-text-1 leading-relaxed">{renderCommentContent(c.content)}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {/* Comment input */}
              <div className="bg-bg-2 border border-border rounded-xl p-3 relative">
                <textarea
                  ref={commentInputRef}
                  className="textarea bg-transparent border-0 p-0 mb-2 focus:ring-0 w-full"
                  rows={3}
                  placeholder="Añade un comentario... Usa @nombre para citar usuarios"
                  value={newComment}
                  onChange={e => handleCommentChange(e.target.value)}
                  onKeyDown={handleMentionKeyDown}
                />
                
                {/* Mention autocomplete */}
                {showMentionMenu && mentionUsers.length > 0 && (
                  <div className="absolute bottom-full left-3 right-3 mb-1 bg-bg-3 border border-border rounded-lg overflow-hidden shadow-lg z-50">
                    {mentionUsers.map((user, idx) => (
                      <button
                        key={user.id}
                        className={`w-full text-left px-3 py-2 transition-colors flex items-center gap-2 text-xs ${
                          idx === selectedMentionIndex ? 'bg-purple/30 border-l-2 border-l-purple' : 'hover:bg-bg-4'
                        }`}
                        onClick={() => insertMention(user)}
                      >
                        <div className="w-4 h-4 rounded-full bg-purple/20 flex items-center justify-center text-[7px] font-bold text-purple">
                          {user.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span className="font-semibold text-text-1">{user.full_name}</span>
                        <span className="text-text-3 text-[9px]">{user.email}</span>
                      </button>
                    ))}
                  </div>
                )}
                
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
              onClick={() => setShowDeleteConfirm(true)}
            >
              🗑 Eliminar Tarea
            </button>

            {/* Metadata */}
            <div className="bg-bg-2 border border-border rounded-xl p-3 space-y-3">
              <div className="text-[10px] font-semibold text-text-3 uppercase tracking-wider mb-2">Información</div>
              
              {task.project_name && (
                <div>
                  <label className="text-[10px] text-text-3 block mb-1">Proyecto</label>
                  <div className="text-xs text-text-0 px-3 py-2 bg-bg-3 rounded-lg font-semibold">{task.project_name}</div>
                </div>
              )}

              {task.creator_name && (
                <div>
                  <label className="text-[10px] text-text-3 block mb-1">Creado por</label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-bg-3 rounded-lg">
                    <div className="w-5 h-5 rounded-full bg-purple/20 flex items-center justify-center text-[8px] font-bold text-purple">
                      {getInitials(task.creator_name)}
                    </div>
                    <span className="text-xs text-text-1 font-semibold">{task.creator_name}</span>
                  </div>
                </div>
              )}

              <div className="text-[10px] font-semibold text-text-3 uppercase tracking-wider mb-2">Configuración</div>
              
              <div>
                <label className="text-[10px] text-text-3 block mb-1">Asignado a</label>
                <div className="relative">
                  <button 
                    className="w-full flex items-center gap-2 px-3 py-2 bg-bg-3 rounded-lg hover:bg-bg-4 transition-colors justify-between text-xs text-text-1 group"
                    onClick={() => setAssigneeSearchOpen(!assigneeSearchOpen)}
                  >
                    <span className="flex items-center gap-2 flex-1">
                      {task?.assignee_name ? (
                        <>
                          <div className="w-4 h-4 rounded-full bg-purple/20 flex items-center justify-center text-[7px] font-bold text-purple">
                            {getInitials(task.assignee_name)}
                          </div>
                          <span>{task.assignee_name}</span>
                        </>
                      ) : (
                        <span className="text-text-3">Sin asignar</span>
                      )}
                    </span>
                    <span className="text-text-3 group-hover:text-text-2">⋯</span>
                  </button>
                  
                  {assigneeSearchOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-bg-3 border border-border rounded-lg shadow-lg z-50 max-h-56 overflow-y-auto">
                      <div className="p-2 sticky top-0 bg-bg-3 border-b border-border">
                        <input
                          type="text"
                          placeholder="Buscar usuario..."
                          className="input text-xs w-full"
                          value={assigneeSearchQuery}
                          onChange={e => setAssigneeSearchQuery(e.target.value)}
                          autoFocus
                        />
                      </div>
                      {availableUsers
                        .filter(u => 
                          u.full_name.toLowerCase().includes(assigneeSearchQuery.toLowerCase()) ||
                          u.email.toLowerCase().includes(assigneeSearchQuery.toLowerCase())
                        )
                        .map(u => (
                          <button
                            key={u.id}
                            onClick={() => {
                              setTask(prev => prev ? { ...prev, assignee_id: u.id, assignee_name: u.full_name } : null);
                              updateField('assignee_id', u.id);
                              setAssigneeSearchOpen(false);
                              setAssigneeSearchQuery('');
                            }}
                            className={`w-full text-left px-3 py-2 flex items-center gap-2 transition-colors text-xs hover:bg-bg-4 ${
                              task?.assignee_id === u.id ? 'bg-purple/15 border-l-2 border-l-purple' : ''
                            }`}
                          >
                            <div className="w-5 h-5 rounded-full bg-purple/20 flex items-center justify-center text-[8px] font-bold text-purple">
                              {getInitials(u.full_name)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-text-1 truncate">{u.full_name}</p>
                              <p className="text-[9px] text-text-3 truncate">{u.email}</p>
                            </div>
                            {task?.assignee_id === u.id && <span className="text-purple">✓</span>}
                          </button>
                        ))}
                      {task?.assignee_id && (
                        <button
                          onClick={() => {
                            setTask(prev => prev ? { ...prev, assignee_id: null, assignee_name: null } : null);
                            updateField('assignee_id', null);
                            setAssigneeSearchOpen(false);
                            setAssigneeSearchQuery('');
                          }}
                          className="w-full text-left px-3 py-2 flex items-center gap-2 transition-colors text-xs hover:bg-bg-4 border-t border-border text-text-3 hover:text-text-2"
                        >
                          ✕ Desasignar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
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

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Eliminar tarea"
        message="¿Está seguro que desea eliminar esta tarea? No se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDangerous
        onConfirm={() => {
          setShowDeleteConfirm(false);
          handleDeleteTask();
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* Delete comment confirmation dialog */}
      <ConfirmDialog
        isOpen={!!deleteCommentId}
        title="Eliminar comentario"
        message="¿Está seguro que desea eliminar este comentario? No se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDangerous
        onConfirm={() => {
          if (deleteCommentId) handleDeleteComment(deleteCommentId);
        }}
        onCancel={() => setDeleteCommentId(null)}
      />

      {/* Comment edit history modal */}
      {editHistoryCommentId && commentEdits[editHistoryCommentId] && (
        <div className="fixed inset-0 bg-bg-0/80 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-2 border border-border rounded-2xl w-full max-w-2xl max-h-96 overflow-y-auto p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-0">Historial de Ediciones</h3>
              <button
                onClick={() => {
                  setEditHistoryCommentId(null);
                  setCommentEdits({});
                }}
                className="text-text-3 hover:text-text-1 text-lg"
              >
                ✕
              </button>
            </div>

            {loadingEdits ? (
              <p className="text-xs text-text-3">Cargando...</p>
            ) : (
              <div className="space-y-4">
                {commentEdits[editHistoryCommentId].edits.length === 0 ? (
                  <p className="text-xs text-text-3">No hay ediciones previas</p>
                ) : (
                  commentEdits[editHistoryCommentId].edits.map((edit: any, idx: number) => (
                    <div key={edit.id} className="bg-bg-3 border border-border/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-4 h-4 rounded-full bg-purple/20 flex items-center justify-center text-[7px] font-bold text-purple">
                          {edit.editor_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </div>
                        <span className="text-xs font-semibold text-text-0">{edit.editor_name}</span>
                        <span className="text-[9px] text-text-3 ml-auto">{formatDateTime(edit.edited_at)}</span>
                      </div>
                      {edit.reason && (
                        <p className="text-[9px] text-text-2 mb-2 italic">Razón: {edit.reason}</p>
                      )}
                      <div className="bg-bg-2 border border-border/30 rounded p-2 text-[9px] text-text-1 max-h-24 overflow-y-auto leading-relaxed">
                        {edit.original_content}
                      </div>
                      {idx === 0 && (
                        <div className="mt-2 pt-2 border-t border-border/30">
                          <p className="text-[9px] text-text-3 mb-1">Versión actual:</p>
                          <div className="bg-bg-2 border border-border/30 rounded p-2 text-[9px] text-text-1 max-h-24 overflow-y-auto leading-relaxed">
                            {commentEdits[editHistoryCommentId].current.content}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
