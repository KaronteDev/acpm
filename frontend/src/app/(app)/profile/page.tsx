'use client';
import { useState } from 'react';
import { useAuthStore } from '@/lib/store';
import { auth } from '@/lib/api';
import { ROLE_LABELS, ROLE_COLOR, getInitials } from '@/lib/utils';

export default function ProfilePage() {
  const { user, setAuth, token } = useAuthStore();
  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [timezone, setTimezone] = useState(user?.timezone ?? 'Europe/Madrid');
  const [saving, setSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  if (!user || !token) return null;

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setProfileMsg('');
    try {
      const { user: updated } = await auth.updateProfile({ full_name: fullName, timezone } as never);
      setAuth({ ...user!, ...updated }, token!);
      setProfileMsg('Perfil actualizado correctamente');
    } catch (err: unknown) {
      setProfileMsg(err instanceof Error ? err.message : 'Error al actualizar');
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdMsg(null);
    if (newPwd !== confirmPwd) {
      setPwdMsg({ type: 'err', text: 'Las contraseñas no coinciden' });
      return;
    }
    setPwdLoading(true);
    try {
      await auth.changePassword(currentPwd, newPwd);
      setPwdMsg({ type: 'ok', text: 'Contraseña cambiada correctamente' });
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } catch (err: unknown) {
      setPwdMsg({ type: 'err', text: err instanceof Error ? err.message : 'Error al cambiar contraseña' });
    } finally {
      setPwdLoading(false);
    }
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
            style={{ backgroundColor: ROLE_COLOR[user.role] || '#6A8AAE' }}
          >
            {getInitials(user.full_name)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-0">{user.full_name}</h2>
            <p className="text-xs text-text-2">{user.email}</p>
            <span
              className="inline-block mt-1 text-xs px-2 py-0.5 rounded border"
              style={{ borderColor: ROLE_COLOR[user.role], color: ROLE_COLOR[user.role], backgroundColor: ROLE_COLOR[user.role] + '15' }}
            >
              {ROLE_LABELS[user.role]}
            </span>
          </div>
        </div>

        {/* Profile form */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Información de Perfil</span>
          </div>
          <form onSubmit={handleSaveProfile} className="p-5 space-y-4">
            <div>
              <label className="text-xs text-text-2 mb-1 block">Nombre completo</label>
              <input
                type="text"
                className="input w-full"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
                minLength={2}
              />
            </div>
            <div>
              <label className="text-xs text-text-2 mb-1 block">Email</label>
              <input type="email" className="input w-full opacity-60" value={user.email} disabled />
              <p className="text-[10px] text-text-3 mt-1">El email no se puede cambiar desde aquí</p>
            </div>
            <div>
              <label className="text-xs text-text-2 mb-1 block">Zona horaria</label>
              <select className="select w-full" value={timezone} onChange={e => setTimezone(e.target.value)}>
                <option value="Europe/Madrid">Europe/Madrid</option>
                <option value="Europe/London">Europe/London</option>
                <option value="America/New_York">America/New_York</option>
                <option value="America/Los_Angeles">America/Los_Angeles</option>
                <option value="Asia/Tokyo">Asia/Tokyo</option>
                <option value="UTC">UTC</option>
              </select>
            </div>

            {profileMsg && (
              <div className="text-xs px-3 py-2 rounded bg-teal-dark/10 border border-teal-dark/30 text-teal-dark">{profileMsg}</div>
            )}

            <button type="submit" disabled={saving} className="btn btn-primary text-xs">
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </form>
        </div>

        {/* Change password */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Cambiar Contraseña</span>
          </div>
          <form onSubmit={handleChangePassword} className="p-5 space-y-4">
            <div>
              <label className="text-xs text-text-2 mb-1 block">Contraseña actual</label>
              <input
                type="password"
                className="input w-full"
                value={currentPwd}
                onChange={e => setCurrentPwd(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs text-text-2 mb-1 block">Nueva contraseña</label>
              <input
                type="password"
                className="input w-full"
                value={newPwd}
                onChange={e => setNewPwd(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="text-xs text-text-2 mb-1 block">Confirmar nueva contraseña</label>
              <input
                type="password"
                className="input w-full"
                value={confirmPwd}
                onChange={e => setConfirmPwd(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {pwdMsg && (
              <div className={`text-xs px-3 py-2 rounded border ${
                pwdMsg.type === 'ok' ? 'bg-teal-dark/10 border-teal-dark/30 text-teal-dark' : 'bg-red/10 border-red/30 text-red'
              }`}>{pwdMsg.text}</div>
            )}

            <button type="submit" disabled={pwdLoading} className="btn btn-primary text-xs">
              {pwdLoading ? 'Cambiando...' : 'Cambiar Contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
