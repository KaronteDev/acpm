'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PreferencesPanel } from '@/components/PreferencesPanel';
import { auth } from '@/lib/api';
import type { User } from '@/lib/api';

export default function PreferencesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const { user: userData } = await auth.me();
        setUser(userData);
      } catch (err) {
        console.error('Error loading user:', err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-0 flex items-center justify-center">
        <div className="text-text-2">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-0 to-bg-1">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="mb-4 text-text-2 hover:text-text-0 flex items-center gap-1 transition-colors"
          >
            ← Volver
          </button>
          <h1 className="text-3xl font-bold text-text-0">Preferencias</h1>
          <p className="text-text-2 text-sm mt-1">Personaliza tu experiencia en ACPM</p>
        </div>

        {/* User Info */}
        {user && (
          <div className="mb-8 p-4 bg-bg-2 rounded-xl border border-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple to-teal flex items-center justify-center text-white font-bold text-lg">
                {user.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-text-0">{user.full_name}</p>
                <p className="text-xs text-text-2">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Preferences Panel */}
        <PreferencesPanel />
      </div>
    </div>
  );
}
