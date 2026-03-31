'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { users } from '@/lib/api';
import type { User, UserRole } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { ROLE_LABELS, ROLE_COLOR, getInitials, formatDate } from '@/lib/utils';

const ALL_ROLES: UserRole[] = [
  'admin', 'architect_lead', 'deep_contributor', 'connector',
  'flow_guardian', 'product_visionary', 'devops_integrator',
  'quality_auditor', 'stakeholder',
];

export default function AdminUsersPage() {
  const router = useRouter();
  const currentUser = useAuthStore(s => s.user);
  const [userList, setUserList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [error, setError] = useState('');

  // Redirect non-admin
  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [currentUser, router]);

  useEffect(() => {
    loadUsers();
  }, []);

  function loadUsers() {
    setLoading(true);
    users.list()
      .then(r => setUserList(r.users))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  async function handleRoleChange(userId: string, role: string) {
    try {
      const { user } = await users.update(userId, { role });
      setUserList(prev => prev.map(u => u.id === userId ? { ...u, ...user } : u));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cambiar rol');
    }
  }

  async function handleToggleActive(userId: string, isActive: boolean) {
    try {
      const { user } = await users.update(userId, { is_active: !isActive });
      setUserList(prev => prev.map(u => u.id === userId ? { ...u, ...user } : u));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al cambiar estado');
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!window.confirm('¿Está seguro que desea eliminar este usuario? No se puede deshacer.')) return;
    try {
      await users.delete(userId);
      setUserList(prev => prev.filter(u => u.id !== userId));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al eliminar usuario');
    }
  }

  if (currentUser?.role !== 'admin') return null;

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-text-0">Gestión de Usuarios</h2>
          <p className="text-xs text-text-2 mt-1">{userList.length} usuario(s) registrado(s)</p>
        </div>
        <button onClick={() => { setShowCreate(true); setError(''); }} className="btn btn-primary text-xs">
          + Nuevo Usuario
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-2 bg-red/10 border border-red/30 rounded-lg text-red text-xs">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-text-3 hover:text-text-1">✕</button>
        </div>
      )}

      {/* Create user modal */}
      {showCreate && <CreateUserModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); loadUsers(); }} />}

      {/* Edit user modal */}
      {showEditPanel && editingId && <EditUserModal userId={editingId} onClose={() => { setShowEditPanel(false); setEditingId(null); }} onSaved={() => { setShowEditPanel(false); setEditingId(null); loadUsers(); }} />}

      {loading ? (
        <div className="text-center py-16 text-text-3">Cargando usuarios...</div>
      ) : (
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-[2fr_2fr_1.5fr_1fr_auto] gap-4 px-4 py-2 text-[10px] uppercase tracking-wider text-text-3 font-semibold">
            <span>Usuario</span>
            <span>Email</span>
            <span>Rol</span>
            <span>Estado</span>
            <span className="w-20 text-right">Acciones</span>
          </div>

          {userList.map(u => (
            <div
              key={u.id}
              className={`grid grid-cols-[2fr_2fr_1.5fr_1fr_auto] gap-4 items-center px-4 py-3 rounded-lg border transition-colors ${
                u.is_active ? 'bg-bg-2 border-border hover:border-border-hi' : 'bg-bg-2/50 border-border/50 opacity-60'
              }`}
            >
              {/* Name + Avatar */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: ROLE_COLOR[u.role] || '#6A8AAE' }}
                >
                  {getInitials(u.full_name)}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-text-0 truncate">{u.full_name}</div>
                  <div className="text-[10px] text-text-3">
                    {u.last_seen_at ? `Visto ${formatDate(u.last_seen_at)}` : 'Sin actividad'}
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="text-xs text-text-1 truncate">{u.email}</div>

              {/* Role */}
              <div>
                <span
                  className="text-xs px-2 py-1 rounded border"
                  style={{ borderLeftColor: ROLE_COLOR[u.role], borderLeftWidth: 3 }}
                >
                  {ROLE_LABELS[u.role]}
                </span>
              </div>

              {/* Status */}
              <div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${u.is_active ? 'bg-teal-dark/15 text-teal-dark' : 'bg-red/10 text-red'}`}>
                  {u.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-1 w-20 justify-end">
                {u.id !== currentUser?.id && (
                  <>
                    <button
                      onClick={() => { setEditingId(u.id); setShowEditPanel(true); }}
                      className="text-xs px-2 py-1 rounded text-purple hover:bg-purple/10 transition-colors"
                      title="Editar usuario"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="text-xs px-2 py-1 rounded text-red hover:bg-red/10 transition-colors"
                      title="Eliminar usuario"
                    >
                      🗑
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ email: '', full_name: '', password: '', role: 'deep_contributor' as UserRole });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await users.create(form);
      onCreated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear usuario');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-0/80" onClick={onClose}>
      <div className="bg-bg-2 border border-border rounded-xl p-6 w-full max-w-md shadow-xl animate-slide-up" onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-bold text-text-0 mb-4">Crear Usuario</h3>

        {error && (
          <div className="mb-3 px-3 py-2 bg-red/10 border border-red/30 rounded text-red text-xs">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-text-2 mb-1 block">Nombre completo</label>
            <input
              type="text"
              className="input w-full"
              value={form.full_name}
              onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
              required
              minLength={2}
            />
          </div>
          <div>
            <label className="text-xs text-text-2 mb-1 block">Email</label>
            <input
              type="email"
              className="input w-full"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="text-xs text-text-2 mb-1 block">Contraseña</label>
            <input
              type="password"
              className="input w-full"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="text-xs text-text-2 mb-1 block">Rol</label>
            <select
              className="select w-full"
              value={form.role}
              onChange={e => setForm(p => ({ ...p, role: e.target.value as UserRole }))}
            >
              {ALL_ROLES.map(r => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn btn-ghost text-xs flex-1">Cancelar</button>
            <button type="submit" disabled={loading} className="btn btn-primary text-xs flex-1">
              {loading ? 'Creando...' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditUserModal({ userId, onClose, onSaved }: { userId: string; onClose: () => void; onSaved: () => void }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<Partial<User>>({});

  useEffect(() => {
    users.get(userId)
      .then(r => {
        setUser(r.user);
        setForm(r.user);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Error cargando usuario'))
      .finally(() => setLoading(false));
  }, [userId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await users.update(userId, form);
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-0/80">
      <div className="bg-bg-2 border border-border rounded-xl p-6 w-full max-w-md">
        <div className="text-center text-text-3">Cargando...</div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-0/80" onClick={onClose}>
      <div className="bg-bg-2 border border-border rounded-xl p-6 w-full max-w-md shadow-xl animate-slide-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-bold text-text-0 mb-4">Editar Usuario</h3>

        {error && (
          <div className="mb-3 px-3 py-2 bg-red/10 border border-red/30 rounded text-red text-xs">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-text-2 mb-1 block">Nombre completo</label>
            <input
              type="text"
              className="input w-full"
              value={form.full_name || ''}
              onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-text-2 mb-1 block">Email</label>
            <input
              type="email"
              className="input w-full"
              value={form.email || ''}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-text-2 mb-1 block">Rol</label>
            <select
              className="select w-full"
              value={form.role || ''}
              onChange={e => setForm(p => ({ ...p, role: e.target.value as UserRole }))}
            >
              {ALL_ROLES.map(r => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-text-2 mb-1 block">Zona Horaria</label>
            <input
              type="text"
              className="input w-full"
              value={form.timezone || ''}
              onChange={e => setForm(p => ({ ...p, timezone: e.target.value }))}
              placeholder="Ej: America/New_York"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-xs text-text-2">
              <input
                type="checkbox"
                checked={form.is_active || false}
                onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
                className="accent-teal-dark"
              />
              Activo
            </label>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn btn-ghost text-xs flex-1">Cancelar</button>
            <button type="submit" disabled={saving} className="btn btn-primary text-xs flex-1">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

