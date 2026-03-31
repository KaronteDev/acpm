'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { auth } from '@/lib/api';
import { ROLE_LABELS, getInitials } from '@/lib/utils';
import { NotificationBell } from '@/components/NotificationBell';

const NAV = [
  { href: '/dashboard', icon: '⌘', label: 'Dashboard' },
  { href: '/projects', icon: '◈', label: 'Proyectos' },
  { href: '/kanban', icon: '⊞', label: 'Kanban' },
  { href: '/sprint', icon: '⧖', label: 'Sprint' },
  null,
  { href: '/wellness', icon: '◐', label: 'Bienestar', badge: 'alerts' },
  { href: '/knowledge', icon: '◉', label: 'Conocimiento' },
  null,
  { href: '/admin/users', icon: '🛡', label: 'Usuarios', adminOnly: true },
];

function UserMenu({ user }: { user: any }) {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-bg-3 transition-colors w-full"
      >
        <div className="w-8 h-8 rounded-full bg-acpm-brand flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
          {getInitials(user.full_name)}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="text-xs font-semibold text-text-0 truncate">{user.full_name}</div>
          <div className="text-[10px] text-teal-dark truncate">{ROLE_LABELS[user.role]?.split(' ').slice(1).join(' ')}</div>
        </div>
        <span className="text-xs text-text-3">{showMenu ? '▲' : '▼'}</span>
      </button>

      {showMenu && (
        <div className="absolute bottom-full mb-2 left-0 right-0 bg-bg-2 border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          <Link
            href="/profile"
            onClick={() => setShowMenu(false)}
            className="flex items-center gap-2 px-3 py-2 text-xs text-text-1 hover:bg-bg-3 hover:text-text-0 transition-colors border-b border-border"
          >
            👤 Perfil
          </Link>
          <Link
            href="/preferences"
            onClick={() => setShowMenu(false)}
            className="flex items-center gap-2 px-3 py-2 text-xs text-text-1 hover:bg-bg-3 hover:text-text-0 transition-colors border-b border-border"
          >
            ⚙️ Preferencias
          </Link>
          <button
            onClick={() => {
              logout();
              router.replace('/login');
              setShowMenu(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red transition-colors"
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.backgroundColor = 'color-mix(in srgb, rgb(231 76 60) 10%, transparent)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.backgroundColor = 'transparent';
            }}
          >
            🚪 Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, isLoading, setAuth, logout, setLoading } = useAuthStore();

  useEffect(() => {
    if (!token) { setLoading(false); router.replace('/login'); return; }
    if (!user) {
      auth.me()
        .then(({ user }) => setAuth(user, token))
        .catch(() => { logout(); router.replace('/login'); });
    } else {
      setLoading(false);
    }
  }, [token, user, router, setAuth, logout, setLoading]);

  if (isLoading || !user) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg-0">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-acpm-brand flex items-center justify-center text-white font-bold font-mono animate-pulse-slow">AC</div>
          <span className="text-text-2 text-sm">Cargando ACPM...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="w-[220px] min-w-[220px] bg-bg-1 border-r border-border flex flex-col overflow-hidden">
        {/* Logo */}
        <div className="px-4 py-4 border-b border-border flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-acpm-brand flex items-center justify-center text-white font-bold text-xs font-mono shadow-glow-purple">
            AC
          </div>
          <div>
            <div className="text-sm font-bold text-text-0 tracking-tight">ACPM</div>
            <div className="text-[10px] text-text-3">Altas Capacidades PM</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto">
          <div className="px-3 space-y-0.5">
            {NAV.map((item, i) => {
              if (!item) return <div key={i} className="my-2 border-t border-border/50" />;
              if ('adminOnly' in item && item.adminOnly && user.role !== 'admin') return null;
              const active = pathname.startsWith(item.href);
              
              // Special handling for Projects link to restore last visited route
              if (item.href === '/projects') {
                return (
                  <button
                    key={item.href}
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        const lastRoute = localStorage.getItem('acpm_last_projects_route');
                        
                        // If last route was a task, go to that task
                        if (lastRoute && lastRoute.startsWith('/tasks/')) {
                          router.push(lastRoute);
                        } 
                        // Otherwise go to saved project or projects list
                        else if (lastRoute && lastRoute.startsWith('/projects/')) {
                          router.push(lastRoute);
                        } 
                        // Default to projects list
                        else {
                          router.push('/projects');
                        }
                      }
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 border-l-2 ${
                      active
                        ? 'bg-purple/10 text-purple border-purple'
                        : 'text-text-2 border-transparent hover:bg-bg-3 hover:text-text-1'
                    }`}
                  >
                    <span className="w-4 text-center text-base">{item.icon}</span>
                    <span className="flex-1 font-medium text-left">{item.label}</span>
                  </button>
                );
              }
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 border-l-2 ${
                    active
                      ? 'bg-purple/10 text-purple border-purple'
                      : 'text-text-2 border-transparent hover:bg-bg-3 hover:text-text-1'
                  }`}
                >
                  <span className="w-4 text-center text-base">{item.icon}</span>
                  <span className="flex-1 font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User */}
        <div className="px-3 py-3 border-t border-border">
          <UserMenu user={user} />
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Topbar */}
        <header className="h-13 bg-bg-1 border-b border-border flex items-center px-5 gap-4 flex-shrink-0">
          <h1 className="text-sm font-semibold text-text-0 flex-1">
            {NAV.find(n => n && pathname.startsWith(n.href))?.label ?? 'ACPM'}
          </h1>

          {/* Cognitive status bar */}
          <div 
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--accent-teal-dark) 8%, transparent)',
              borderColor: 'color-mix(in srgb, var(--accent-teal-dark) 20%, transparent)',
              borderWidth: '1px'
            }}
          >
            <span className="text-text-2">Energía</span>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(n => (
                <div key={n} className={`w-1.5 h-1.5 rounded-full ${n <= 4 ? 'bg-teal-dark' : 'bg-bg-4'}`} />
              ))}
            </div>
            <span 
              className="text-teal-dark rounded px-1.5 py-0.5 text-[10px] font-semibold"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--accent-teal-dark) 15%, transparent)',
                borderColor: 'color-mix(in srgb, var(--accent-teal-dark) 30%, transparent)',
                borderWidth: '1px'
              }}
            >
              🛡 Flujo Activo
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <NotificationBell />
            <div className="flex items-center gap-1.5 text-xs text-text-2 bg-bg-3 border border-border rounded-lg px-3 py-1.5 cursor-pointer hover:border-border-hi">
              <span>Buscar</span>
              <span className="kbd">⌘K</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
