'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

type View = 'login' | 'forgot' | 'reset';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore(s => s.setAuth);
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('elena@acpm.dev');
  const [password, setPassword] = useState('acpm2026');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');

  // Reset password state
  const [resetToken, setResetToken] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  useEffect(() => {
    const token = searchParams.get('reset_token');
    if (token) {
      setResetToken(token);
      setView('reset');
    }
  }, [searchParams]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { token, user } = await auth.login(email, password);
      setAuth(user, token);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await auth.forgotPassword(forgotEmail);
      setMessage(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar email');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPwd !== confirmPwd) { setError('Las contraseñas no coinciden'); return; }
    setLoading(true);
    setError('');
    try {
      await auth.resetPassword(resetToken, newPwd);
      setMessage('Contraseña restablecida correctamente. Ya puedes iniciar sesión.');
      setView('login');
      setNewPwd('');
      setConfirmPwd('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al restablecer contraseña');
    } finally {
      setLoading(false);
    }
  }

  const demoUsers = [
    { email: 'elena@acpm.dev', name: 'Elena García', role: '👑 Architect-Lead' },
    { email: 'marc@acpm.dev', name: 'Marc Vidal', role: '🔬 Deep Contributor' },
    { email: 'sara@acpm.dev', name: 'Sara Roca', role: '🔗 Connector' },
    { email: 'pau@acpm.dev', name: 'Pau López', role: '🎯 Flow Guardian' },
  ];

  return (
    <div className="min-h-screen bg-bg-0 flex items-center justify-center p-4 overflow-auto">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-dark/5 rounded-full blur-3xl" />
        <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
          <circle cx="50" cy="50" r="20" fill="none" stroke="#1A3B5A" strokeWidth="0.2"/>
          <circle cx="50" cy="50" r="35" fill="none" stroke="#1A3B5A" strokeWidth="0.15"/>
          <circle cx="50" cy="50" r="48" fill="none" stroke="#1A3B5A" strokeWidth="0.1"/>
        </svg>
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-acpm-brand mb-4 shadow-glow-purple">
            <span className="text-white font-bold text-xl font-mono">AC</span>
          </div>
          <h1 className="text-2xl font-bold text-text-0 tracking-tight">ACPM</h1>
          <p className="text-text-2 text-sm mt-1">Altas Capacidades Project Manager</p>
        </div>

        {/* Card */}
        <div className="bg-bg-2 border border-border rounded-2xl p-6 shadow-xl">
          {view === 'login' && (
            <>
              <h2 className="text-base font-semibold text-text-0 mb-5">Iniciar sesión</h2>

              {message && (
                <div className="bg-teal-dark/10 border border-teal-dark/30 text-teal-dark text-xs px-3 py-2 rounded-lg mb-4">
                  {message}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-text-2 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="input"
                    placeholder="tu@email.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-2 mb-1.5">Contraseña</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="input"
                    placeholder="••••••••"
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red/10 border border-red/30 text-red text-xs px-3 py-2 rounded-lg">
                    {error}
                  </div>
                )}

                <button type="submit" className="btn btn-primary w-full justify-center" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Accediendo...
                    </span>
                  ) : 'Acceder al sistema'}
                </button>
              </form>

              <button
                onClick={() => { setView('forgot'); setError(''); setMessage(''); }}
                className="w-full text-center text-xs text-purple hover:text-purple-light mt-4 transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </button>

              {/* Demo users */}
              <div className="mt-5 pt-5 border-t border-border">
                <p className="text-xs text-text-3 mb-3 text-center">Usuarios demo (contraseña: acpm2026)</p>
                <div className="space-y-1.5">
                  {demoUsers.map(u => (
                    <button
                      key={u.email}
                      onClick={() => { setEmail(u.email); setPassword('acpm2026'); }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-bg-3 hover:bg-bg-4 border border-border hover:border-border-hi transition-all text-left group"
                    >
                      <div className="w-7 h-7 rounded-full bg-purple/20 flex items-center justify-center text-xs font-bold text-purple flex-shrink-0">
                        {u.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-text-1 group-hover:text-text-0">{u.name}</div>
                        <div className="text-[10px] text-text-3">{u.role}</div>
                      </div>
                      <span className="text-[10px] text-text-3 font-mono">{u.email.split('@')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {view === 'forgot' && (
            <>
              <h2 className="text-base font-semibold text-text-0 mb-2">Recuperar contraseña</h2>
              <p className="text-xs text-text-2 mb-5">Introduce tu email y recibirás instrucciones para restablecer tu contraseña.</p>

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-text-2 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    className="input"
                    placeholder="tu@email.com"
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red/10 border border-red/30 text-red text-xs px-3 py-2 rounded-lg">{error}</div>
                )}
                {message && (
                  <div className="bg-teal-dark/10 border border-teal-dark/30 text-teal-dark text-xs px-3 py-2 rounded-lg">{message}</div>
                )}

                <button type="submit" className="btn btn-primary w-full justify-center" disabled={loading}>
                  {loading ? 'Enviando...' : 'Enviar instrucciones'}
                </button>
              </form>

              <button
                onClick={() => { setView('login'); setError(''); setMessage(''); }}
                className="w-full text-center text-xs text-purple hover:text-purple-light mt-4 transition-colors"
              >
                ← Volver al login
              </button>
            </>
          )}

          {view === 'reset' && (
            <>
              <h2 className="text-base font-semibold text-text-0 mb-2">Restablecer contraseña</h2>
              <p className="text-xs text-text-2 mb-5">Introduce tu nueva contraseña.</p>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-text-2 mb-1.5">Nueva contraseña</label>
                  <input
                    type="password"
                    value={newPwd}
                    onChange={e => setNewPwd(e.target.value)}
                    className="input"
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-2 mb-1.5">Confirmar contraseña</label>
                  <input
                    type="password"
                    value={confirmPwd}
                    onChange={e => setConfirmPwd(e.target.value)}
                    className="input"
                    placeholder="Repite la contraseña"
                    required
                    minLength={6}
                  />
                </div>

                {error && (
                  <div className="bg-red/10 border border-red/30 text-red text-xs px-3 py-2 rounded-lg">{error}</div>
                )}

                <button type="submit" className="btn btn-primary w-full justify-center" disabled={loading}>
                  {loading ? 'Guardando...' : 'Restablecer contraseña'}
                </button>
              </form>

              <button
                onClick={() => { setView('login'); setError(''); setMessage(''); }}
                className="w-full text-center text-xs text-purple hover:text-purple-light mt-4 transition-colors"
              >
                ← Volver al login
              </button>
            </>
          )}
        </div>

        <p className="text-center text-text-3 text-xs mt-6">
          ACPM v1.0.0 · Diseñado para equipos AACC
        </p>
      </div>
    </div>
  );
}
