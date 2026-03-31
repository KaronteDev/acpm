'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/lib/useTheme';
import { useFontSize } from '@/lib/useFontSize';
import { useTextToSpeech } from '@/lib/useTextToSpeech';
import { userPreferences, UserPreferences } from '@/lib/api';

export function PreferencesPanel() {
  const { theme, setTheme, isLoading: themeLoading } = useTheme();
  const { fontSize, setFontSize, isLoading: fontSizeLoading } = useFontSize();
  const { rate, setRate, isSupported: ttsSupported } = useTextToSpeech();
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState('');

  // Load preferences on mount
  useEffect(() => {
    async function loadPreferences() {
      try {
        const data = await userPreferences.get();
        setPrefs(data);
      } catch (err) {
        console.error('Error loading preferences:', err);
        setError(err instanceof Error ? err.message : 'Error loading preferences');
      } finally {
        setLoading(false);
      }
    }
    loadPreferences();
  }, []);

  const handleThemeChange = async (newTheme: 'light' | 'high_contrast' | 'colorblind' | 'dark') => {
    try {
      await setTheme(newTheme);
      await userPreferences.update({ theme_preference: newTheme });
      setSavedMessage('✓ Tema actualizado');
      setTimeout(() => setSavedMessage(''), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating theme');
    }
  };

  const handleFontSizeChange = async (newSize: 'small' | 'normal' | 'large' | 'extra_large') => {
    try {
      setFontSize(newSize);
      await userPreferences.update({ font_size_preference: newSize });
      setSavedMessage('✓ Tamaño de fuente actualizado');
      setTimeout(() => setSavedMessage(''), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating font size');
    }
  };

  const handleTTSToggle = async (enabled: boolean) => {
    try {
      await userPreferences.update({ text_to_speech_enabled: enabled });
      setPrefs(prev => prev ? { ...prev, text_to_speech_enabled: enabled } : null);
      setSavedMessage('✓ Preferencias guardadas');
      setTimeout(() => setSavedMessage(''), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating preferences');
    }
  };

  const handleRateChange = async (newRate: number) => {
    try {
      setRate(newRate);
      await userPreferences.update({ tts_rate: newRate });
      setPrefs(prev => prev ? { ...prev, tts_rate: newRate } : null);
      setSavedMessage('✓ Velocidad actualizada');
      setTimeout(() => setSavedMessage(''), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating rate');
    }
  };

  if (loading || themeLoading || fontSizeLoading) {
    return <div className="p-4 text-center text-text-2">Cargando preferencias...</div>;
  }

  return (
    <div className="max-h-[75vh] overflow-y-auto space-y-8 p-6 bg-bg-1 rounded-xl">
      {error && (
        <div className="p-3 rounded-lg text-sm" style={{
          backgroundColor: 'color-mix(in srgb, var(--accent-red) 15%, transparent)',
          borderColor: 'color-mix(in srgb, var(--accent-red) 30%, transparent)',
          color: 'var(--accent-red)',
          borderWidth: '1px'
        }}>
          {error}
        </div>
      )}

      {savedMessage && (
        <div className="p-3 rounded-lg text-sm animate-fade-in" style={{
          backgroundColor: 'color-mix(in srgb, var(--accent-teal) 15%, transparent)',
          borderColor: 'color-mix(in srgb, var(--accent-teal) 30%, transparent)',
          color: 'var(--accent-teal)',
          borderWidth: '1px'
        }}>
          {savedMessage}
        </div>
      )}

      {/* THEMES */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-text-0 flex items-center gap-2">
          🎨 Esquema de colores
        </h3>
        <p className="text-xs text-text-2 mb-3">Selecciona el esquema que mejor se adapte a tus necesidades</p>

        <div className="grid gap-3">
          {/* Light Theme */}
          <button
            onClick={() => handleThemeChange('light')}
            className="p-4 rounded-lg border-2 transition-all text-left"
            style={{
              borderColor: theme === 'light' ? 'var(--accent-purple)' : 'var(--border-default)',
              backgroundColor: theme === 'light' ? 'color-mix(in srgb, var(--accent-purple) 10%, transparent)' : 'var(--bg-2)',
            }}
            onMouseEnter={(e) => {
              if (theme !== 'light') {
                (e.target as HTMLElement).style.borderColor = 'var(--border-hi)';
              }
            }}
            onMouseLeave={(e) => {
              if (theme !== 'light') {
                (e.target as HTMLElement).style.borderColor = 'var(--border-default)';
              }
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-white border-2 border-text-2"></div>
              <div>
                <div className="font-semibold text-text-0 text-sm">Tema Claro</div>
                <div className="text-xs text-text-2">Para ambientes bien iluminados</div>
              </div>
            </div>
          </button>

          {/* High Contrast Theme */}
          <button
            onClick={() => handleThemeChange('high_contrast')}
            className="p-4 rounded-lg border-2 transition-all text-left"
            style={{
              borderColor: theme === 'high_contrast' ? 'var(--accent-purple)' : 'var(--border-default)',
              backgroundColor: theme === 'high_contrast' ? 'color-mix(in srgb, var(--accent-purple) 10%, transparent)' : 'var(--bg-2)',
            }}
            onMouseEnter={(e) => {
              if (theme !== 'high_contrast') {
                (e.target as HTMLElement).style.borderColor = 'var(--border-hi)';
              }
            }}
            onMouseLeave={(e) => {
              if (theme !== 'high_contrast') {
                (e.target as HTMLElement).style.borderColor = 'var(--border-default)';
              }
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-black border-2 border-yellow flex items-center justify-center text-yellow font-bold text-xs">
                AC
              </div>
              <div>
                <div className="font-semibold text-text-0 text-sm">Alto Contraste</div>
                <div className="text-xs text-text-2">Mayor visibilidad y claridad</div>
              </div>
            </div>
          </button>

          {/* Colorblind Theme */}
          <button
            onClick={() => handleThemeChange('colorblind')}
            className="p-4 rounded-lg border-2 transition-all text-left"
            style={{
              borderColor: theme === 'colorblind' ? 'var(--accent-purple)' : 'var(--border-default)',
              backgroundColor: theme === 'colorblind' ? 'color-mix(in srgb, var(--accent-purple) 10%, transparent)' : 'var(--bg-2)',
            }}
            onMouseEnter={(e) => {
              if (theme !== 'colorblind') {
                (e.target as HTMLElement).style.borderColor = 'var(--border-hi)';
              }
            }}
            onMouseLeave={(e) => {
              if (theme !== 'colorblind') {
                (e.target as HTMLElement).style.borderColor = 'var(--border-default)';
              }
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-gray-300 border-2 border-blue-600 flex items-center justify-center">
                <div className="w-5 h-5 rounded-full bg-orange-600"></div>
              </div>
              <div>
                <div className="font-semibold text-text-0 text-sm">Amigable Daltonismo</div>
                <div className="text-xs text-text-2">Colores optimizados para visión de color</div>
              </div>
            </div>
          </button>

          {/* Dark Theme */}
          <button
            onClick={() => handleThemeChange('dark')}
            className="p-4 rounded-lg border-2 transition-all text-left"
            style={{
              borderColor: theme === 'dark' ? 'var(--accent-teal)' : 'var(--border-default)',
              backgroundColor: theme === 'dark' ? 'color-mix(in srgb, var(--accent-teal) 10%, transparent)' : 'var(--bg-2)',
            }}
            onMouseEnter={(e) => {
              if (theme !== 'dark') {
                (e.target as HTMLElement).style.borderColor = 'var(--border-hi)';
              }
            }}
            onMouseLeave={(e) => {
              if (theme !== 'dark') {
                (e.target as HTMLElement).style.borderColor = 'var(--border-default)';
              }
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-gray-900 border-2 border-cyan-400 flex items-center justify-center">
                <div className="text-sm">🌙</div>
              </div>
              <div>
                <div className="font-semibold text-text-0 text-sm">Tema Oscuro</div>
                <div className="text-xs text-text-2">Original con adaptado para baja luminosidad</div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* FONT SIZE */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-text-0 flex items-center gap-2">
          📝 Tamaño de fuente
        </h3>
        <p className="text-xs text-text-2 mb-3">Ajusta el tamaño de letra para una mejor legibilidad</p>

        <div className="grid grid-cols-2 gap-3">
          {/* Small Font */}
          <button
            onClick={() => handleFontSizeChange('small')}
            className="p-3 rounded-lg border-2 transition-all text-left"
            style={{
              borderColor: fontSize === 'small' ? 'var(--accent-teal)' : 'var(--border-default)',
              backgroundColor: fontSize === 'small' ? 'color-mix(in srgb, var(--accent-teal) 10%, transparent)' : 'var(--bg-2)',
            }}
            onMouseEnter={(e) => {
              if (fontSize !== 'small') {
                (e.target as HTMLElement).style.borderColor = 'var(--border-hi)';
              }
            }}
            onMouseLeave={(e) => {
              if (fontSize !== 'small') {
                (e.target as HTMLElement).style.borderColor = 'var(--border-default)';
              }
            }}
          >
            <div className="text-center">
              <div className="text-xs font-semibold text-text-0 mb-1">A</div>
              <div className="text-xs text-text-2">Pequeño</div>
            </div>
          </button>

          {/* Normal Font */}
          <button
            onClick={() => handleFontSizeChange('normal')}
            className="p-3 rounded-lg border-2 transition-all text-left"
            style={{
              borderColor: fontSize === 'normal' ? 'var(--accent-teal)' : 'var(--border-default)',
              backgroundColor: fontSize === 'normal' ? 'color-mix(in srgb, var(--accent-teal) 10%, transparent)' : 'var(--bg-2)',
            }}
            onMouseEnter={(e) => {
              if (fontSize !== 'normal') {
                (e.target as HTMLElement).style.borderColor = 'var(--border-hi)';
              }
            }}
            onMouseLeave={(e) => {
              if (fontSize !== 'normal') {
                (e.target as HTMLElement).style.borderColor = 'var(--border-default)';
              }
            }}
          >
            <div className="text-center">
              <div className="text-sm font-semibold text-text-0 mb-1">A</div>
              <div className="text-xs text-text-2">Normal</div>
            </div>
          </button>

          {/* Large Font */}
          <button
            onClick={() => handleFontSizeChange('large')}
            className="p-3 rounded-lg border-2 transition-all text-left"
            style={{
              borderColor: fontSize === 'large' ? 'var(--accent-teal)' : 'var(--border-default)',
              backgroundColor: fontSize === 'large' ? 'color-mix(in srgb, var(--accent-teal) 10%, transparent)' : 'var(--bg-2)',
            }}
            onMouseEnter={(e) => {
              if (fontSize !== 'large') {
                (e.target as HTMLElement).style.borderColor = 'var(--border-hi)';
              }
            }}
            onMouseLeave={(e) => {
              if (fontSize !== 'large') {
                (e.target as HTMLElement).style.borderColor = 'var(--border-default)';
              }
            }}
          >
            <div className="text-center">
              <div className="text-lg font-semibold text-text-0 mb-1">A</div>
              <div className="text-xs text-text-2">Grande</div>
            </div>
          </button>

          {/* Extra Large Font */}
          <button
            onClick={() => handleFontSizeChange('extra_large')}
            className="p-3 rounded-lg border-2 transition-all text-left"
            style={{
              borderColor: fontSize === 'extra_large' ? 'var(--accent-teal)' : 'var(--border-default)',
              backgroundColor: fontSize === 'extra_large' ? 'color-mix(in srgb, var(--accent-teal) 10%, transparent)' : 'var(--bg-2)',
            }}
            onMouseEnter={(e) => {
              if (fontSize !== 'extra_large') {
                (e.target as HTMLElement).style.borderColor = 'var(--border-hi)';
              }
            }}
            onMouseLeave={(e) => {
              if (fontSize !== 'extra_large') {
                (e.target as HTMLElement).style.borderColor = 'var(--border-default)';
              }
            }}
          >
            <div className="text-center">
              <div className="text-xl font-semibold text-text-0 mb-1">A</div>
              <div className="text-xs text-text-2">Muy grande</div>
            </div>
          </button>
        </div>
      </div>

      {/* TEXT TO SPEECH */}
      {ttsSupported && (
        <div className="border-t border-border pt-6 space-y-3">
          <h3 className="text-sm font-semibold text-text-0 flex items-center gap-2">
            🔊 Síntesis de voz (TTS)
          </h3>
          <p className="text-xs text-text-2 mb-3">Lee notificaciones y contenido automáticamente</p>

          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 bg-bg-2 rounded-lg border border-border cursor-pointer hover:border-border-hi transition-colors">
              <input
                type="checkbox"
                checked={prefs?.text_to_speech_enabled || false}
                onChange={(e) => handleTTSToggle(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm font-medium text-text-0">
                Habilitar síntesis de voz
              </span>
            </label>

            {prefs?.text_to_speech_enabled && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-text-1">
                  Velocidad: {(typeof prefs.tts_rate === 'number' ? prefs.tts_rate : parseFloat(prefs.tts_rate as any) || 1).toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={prefs.tts_rate}
                  onChange={(e) => handleRateChange(parseFloat(e.target.value))}
                  className="w-full h-2 bg-bg-3 rounded-lg appearance-none cursor-pointer accent-purple"
                />
                <div className="flex justify-between text-xs text-text-3">
                  <span>0.5x (Muy lento)</span>
                  <span>2.0x (Muy rápido)</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!ttsSupported && (
        <div className="border-t border-border pt-6 p-3 bg-amber/10 border border-amber/30 rounded-lg text-xs text-amber">
          ⚠️ Tu navegador no soporta síntesis de voz
        </div>
      )}

      <div className="text-xs text-text-3 border-t border-border pt-6">
        Los cambios se guardan automáticamente en la nube
      </div>
    </div>
  );
}
