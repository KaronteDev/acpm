'use client';
import { useEffect, useState } from 'react';
import { wellness } from '@/lib/api';
import type { WellnessMember, CognitiveAlert } from '@/lib/api';
import { getInitials, calcICC, getICCColor } from '@/lib/utils';

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];

export default function WellnessPage() {
  const [members, setMembers] = useState<WellnessMember[]>([]);
  const [alerts, setAlerts] = useState<CognitiveAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<WellnessMember | null>(null);

  useEffect(() => {
    wellness.team()
      .then(r => { setMembers(r.members); setAlerts(r.alerts.filter(a => !a.resolved)); })
      .finally(() => setLoading(false));
  }, []);

  async function resolveAlert(id: string) {
    await wellness.resolveAlert(id);
    setAlerts(prev => prev.filter(a => a.id !== id));
  }

  // Simulate daily ICC values from member data
  function getMemberDays(m: WellnessMember) {
    const icc = calcICC(m.active_pcc_load, m.cognitive_profile.overload_threshold);
    return DAYS.map((_, i) => {
      const variance = (Math.random() - 0.5) * 2;
      const dayIcc = Math.max(0, Math.min(10, icc + variance));
      return dayIcc >= 8 ? 'red' : dayIcc >= 5 ? 'yellow' : 'green';
    });
  }

  if (loading) return <div className="flex items-center justify-center h-full text-text-3">Cargando bienestar...</div>;

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-text-0">Centro de Bienestar Cognitivo</h2>
          <p className="text-xs text-text-2 mt-1">{members.length} miembros monitorizados · {alerts.length} alertas activas</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost text-xs">📊 Informe Mensual</button>
          <button className="btn btn-teal text-xs">🔄 Rebalancear Carga</button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="mb-6">
          <div className="text-xs font-semibold text-text-2 uppercase tracking-wider mb-3">Alertas Activas</div>
          <div className="space-y-2">
            {alerts.map(alert => (
              <div key={alert.id} className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${
                alert.severity === 'critical' ? 'bg-red/8 border-red/20' :
                alert.severity === 'warning' ? 'bg-amber/8 border-amber/20' :
                'bg-purple/8 border-purple/20'
              }`}>
                <span className="text-base flex-shrink-0">
                  {alert.severity === 'critical' ? '🔴' : alert.severity === 'warning' ? '⚠️' : 'ℹ️'}
                </span>
                <div className="flex-1">
                  <span className="text-xs text-text-1">{alert.message}</span>
                  {alert.full_name && <div className="text-[10px] text-text-3 mt-0.5">{alert.full_name}</div>}
                </div>
                <button
                  onClick={() => resolveAlert(alert.id)}
                  className="btn btn-ghost text-xs py-1 px-2 flex-shrink-0"
                >
                  Resolver
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-5">
        {/* Heatmap */}
        <div className="col-span-2 card">
          <div className="card-header">
            <span className="card-title">Mapa de Calor Cognitivo — Esta semana</span>
            <div className="flex items-center gap-3 text-[10px] text-text-3">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-teal-dark inline-block"/> Óptimo</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber inline-block"/> Elevado</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-red inline-block"/> Sobrecarga</span>
            </div>
          </div>
          <div className="p-4">
            {/* Header row */}
            <div className="grid mb-2" style={{ gridTemplateColumns: '100px repeat(5, 1fr)' }}>
              <div />
              {DAYS.map(d => <div key={d} className="text-[10px] text-text-3 text-center">{d}</div>)}
            </div>
            {/* Member rows */}
            {members.map(m => {
              const icc = calcICC(m.active_pcc_load, m.cognitive_profile.overload_threshold);
              const days = getMemberDays(m);
              return (
                <div key={m.id} className="grid gap-1.5 mb-2 cursor-pointer" style={{ gridTemplateColumns: '100px repeat(5, 1fr)' }}
                  onClick={() => setSelected(selected?.id === m.id ? null : m)}>
                  <div className="flex items-center gap-2 pr-2">
                    <div className="w-6 h-6 rounded-full bg-purple/20 flex items-center justify-center text-[8px] font-bold text-purple flex-shrink-0">
                      {getInitials(m.full_name)}
                    </div>
                    <span className="text-[10px] text-text-2 truncate">{m.full_name.split(' ')[0]}</span>
                  </div>
                  {days.map((day, i) => (
                    <div key={i} className={`h-8 rounded-md flex items-center justify-center text-[9px] font-bold transition-transform hover:scale-105 ${
                      day === 'red' ? 'bg-red/25 text-red' :
                      day === 'yellow' ? 'bg-amber/25 text-amber' :
                      'bg-teal-dark/20 text-teal-dark'
                    }`}>
                      {day === 'red' ? '⚠' : day === 'yellow' ? '~' : '✓'}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Team stats */}
        <div className="space-y-4">
          <div className="card">
            <div className="card-header"><span className="card-title">ICC del Equipo</span></div>
            <div className="p-4 space-y-3">
              {members.map(m => {
                const icc = calcICC(m.active_pcc_load, m.cognitive_profile.overload_threshold);
                const color = getICCColor(icc);
                return (
                  <div key={m.id} className="cursor-pointer hover:bg-bg-3 rounded-lg p-2 -mx-2 transition-colors" onClick={() => setSelected(selected?.id === m.id ? null : m)}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-text-1">{m.full_name.split(' ')[0]}</span>
                      <span className="text-xs font-mono font-bold" style={{ color }}>{(typeof icc === 'number' ? icc : parseFloat(icc as any) || 0).toFixed(1)}/10</span>
                    </div>
                    <div className="bg-bg-4 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${icc * 10}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick stats */}
          <div className="card p-4 space-y-3">
            <div className="text-xs font-semibold text-text-2">Resumen del Equipo</div>
            {[
              { label: 'En zona óptima', value: members.filter(m => calcICC(m.active_pcc_load, m.cognitive_profile.overload_threshold) < 6).length, color: 'text-teal-dark', icon: '✓' },
              { label: 'Carga elevada', value: members.filter(m => { const i = calcICC(m.active_pcc_load, m.cognitive_profile.overload_threshold); return i >= 6 && i < 8; }).length, color: 'text-amber', icon: '~' },
              { label: 'Sobrecarga', value: members.filter(m => calcICC(m.active_pcc_load, m.cognitive_profile.overload_threshold) >= 8).length, color: 'text-red', icon: '⚠' },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-xs text-text-2">{s.icon} {s.label}</span>
                <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected member profile */}
      {selected && (
        <div className="mt-5 card">
          <div className="card-header">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple/20 flex items-center justify-center text-xs font-bold text-purple">{getInitials(selected.full_name)}</div>
              <div>
                <div className="text-sm font-semibold text-text-0">{selected.full_name}</div>
                <div className="text-[10px] text-text-3">Perfil cognitivo detallado</div>
              </div>
            </div>
            <button onClick={() => setSelected(null)} className="text-text-3 hover:text-text-1">✕</button>
          </div>
          <div className="p-5 grid grid-cols-4 gap-4">
            {[
              { label: 'Sesiones 7d', value: selected.total_sessions_7d, icon: '⏱' },
              { label: 'Sesiones flujo', value: selected.flow_sessions_7d, icon: '🛡' },
              { label: 'Energía media', value: (typeof selected.avg_energy_7d === 'number' ? selected.avg_energy_7d : parseFloat(selected.avg_energy_7d as any) || 0).toFixed(1), icon: '⚡' },
              { label: 'PCC activos', value: selected.active_pcc_load, icon: '◉' },
            ].map((s, i) => (
              <div key={i} className="bg-bg-3 rounded-xl p-3 text-center">
                <div className="text-lg mb-1">{s.icon}</div>
                <div className="text-xl font-bold text-text-0">{s.value}</div>
                <div className="text-[10px] text-text-3 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
          {selected.cognitive_profile && (
            <div className="px-5 pb-5 text-xs text-text-2 grid grid-cols-3 gap-3">
              <div className="bg-bg-3 rounded-lg p-2.5">
                <div className="text-[9px] text-text-3 mb-1">Cronotipo</div>
                <div className="font-medium text-text-1 capitalize">{selected.cognitive_profile.chronotype ?? 'No definido'}</div>
              </div>
              <div className="bg-bg-3 rounded-lg p-2.5">
                <div className="text-[9px] text-text-3 mb-1">Umbral sobrecarga</div>
                <div className="font-medium text-text-1">{selected.cognitive_profile.overload_threshold ?? '-'}/10</div>
              </div>
              <div className="bg-bg-3 rounded-lg p-2.5">
                <div className="text-[9px] text-text-3 mb-1">Bloque mínimo</div>
                <div className="font-medium text-text-1">{selected.cognitive_profile.min_focus_block ?? '-'} min</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
