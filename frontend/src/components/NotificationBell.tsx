'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { notifications } from '@/lib/api';
import type { Notification } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';
import { useTextToSpeech } from '@/lib/useTextToSpeech';
import { useTheme } from '@/lib/useTheme';

export function NotificationBell() {
  const router = useRouter();
  const { speak, stop, isSpeaking, isSupported: ttsSupported } = useTextToSpeech();
  const { theme } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsList, setNotificationsList] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [readingAll, setReadingAll] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadUnreadCount();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadUnreadCount() {
    try {
      const { unread_count } = await notifications.unreadCount();
      setUnreadCount(unread_count);
    } catch {
      // Silently fail
    }
  }

  async function loadNotifications() {
    try {
      const { notifications: data } = await notifications.list(true);
      setNotificationsList(data);
    } catch {
      setNotificationsList([]);
    }
  }

  function handleBellClick() {
    if (!showDropdown) {
      loadNotifications();
    }
    setShowDropdown(!showDropdown);
  }

  async function markAsRead(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await notifications.markAsRead(id);
      setNotificationsList(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      await loadUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  async function deleteNotification(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await notifications.delete(id);
      setNotificationsList(prev => prev.filter(n => n.id !== id));
      await loadUnreadCount();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }

  function handleNotificationClick(notification: Notification, e: React.MouseEvent) {
    if (notification.task_id) {
      setShowDropdown(false);
      // Navigate to task with comment anchor if available
      if (notification.comment_id) {
        // Use window.location to ensure hash is processed
        window.location.href = `/tasks/${notification.task_id}#comment-${notification.comment_id}`;
      } else {
        router.push(`/tasks/${notification.task_id}`);
      }
    }
  }

  function buildNotificationText(n: Notification): string {
    let text = n.message;
    if (n.task_title) text += `. Tarea: ${n.task_title}`;
    if (n.comment_content) text += `. Comentario: ${n.comment_content}`;
    return text;
  }

  function handleSpeakNotification(n: Notification, e: React.MouseEvent) {
    e.stopPropagation();
    if (speakingId === n.id) {
      stop();
      setSpeakingId(null);
    } else {
      const text = buildNotificationText(n);
      speak(text);
      setSpeakingId(n.id);
    }
  }

  async function handleReadAll(e: React.MouseEvent) {
    e.stopPropagation();
    if (readingAll) {
      stop();
      setReadingAll(false);
      setSpeakingId(null);
      return;
    }

    setReadingAll(true);
    for (let i = 0; i < notificationsList.length; i++) {
      const n = notificationsList[i];
      const text = buildNotificationText(n);
      
      // Speak and wait for it to finish
      await new Promise<void>(resolve => {
        setSpeakingId(n.id);
        speak(text);
        
        // Wait for speech to complete (roughly estimate based on text length and rate)
        const estimatedTime = (text.length / 10) * 1000; // ~10 chars per second
        setTimeout(() => {
          resolve();
        }, estimatedTime + 500);
      });
    }
    
    setReadingAll(false);
    setSpeakingId(null);
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleBellClick}
        className="relative w-9 h-9 rounded-lg flex items-center justify-center text-base hover:bg-bg-3 transition-colors"
        title="Notificaciones"
      >
        🔔
        {unreadCount > 0 && (
          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red flex items-center justify-center text-white text-[9px] font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-bg-2 border border-border rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="p-4 border-b border-border bg-bg-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-text-0">Notificaciones</h2>
              <div className="flex gap-1">
                {ttsSupported && notificationsList.length > 0 && (
                  <button
                    onClick={handleReadAll}
                    className="text-xs px-2 py-1 rounded transition-colors"
                    style={{
                      backgroundColor: readingAll ? 'color-mix(in srgb, var(--accent-red) 15%, transparent)' : 'transparent',
                      color: readingAll ? 'var(--accent-red)' : 'var(--text-2)',
                      border: readingAll ? '1px solid color-mix(in srgb, var(--accent-red) 30%, transparent)' : 'none',
                    }}
                    title={readingAll ? 'Detener lectura' : 'Leer todas'}
                  >
                    {readingAll ? '⏹ Detener' : '🔊 Leer todas'}
                  </button>
                )}
                {unreadCount > 0 && (
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      await notifications.markAllAsRead();
                      await loadUnreadCount();
                      await loadNotifications();
                    }}
                    className="text-xs text-teal-dark hover:text-teal-dark/80"
                  >
                    Marcar todas como leídas
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notificationsList.length === 0 ? (
              <div className="p-6 text-center text-text-3">
                <div className="text-2xl mb-2">✨</div>
                <p className="text-sm">No tienes notificaciones</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notificationsList.map(n => (
                  <div
                    key={n.id}
                    onClick={(e) => handleNotificationClick(n, e)}
                    className={`p-3 hover:bg-bg-3 transition-colors group cursor-pointer ${
                      !n.is_read ? 'bg-purple/5' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-medium text-text-0 leading-relaxed">
                            {n.message}
                          </p>
                          {!n.is_read && (
                            <div className="w-2 h-2 rounded-full bg-teal-dark flex-shrink-0 mt-1" />
                          )}
                        </div>
                        
                        {n.task_title && (
                          <p className="text-[10px] text-text-3 mt-1 truncate">
                            📌 {n.task_title}
                          </p>
                        )}
                        
                        {n.comment_content && (
                          <p className="text-[10px] text-text-2 mt-1 line-clamp-2">
                            "{n.comment_content}"
                          </p>
                        )}
                        
                        <p className="text-[9px] text-text-3 mt-1">
                          {formatDateTime(n.created_at)}
                        </p>
                      </div>

                      <div className="flex gap-1 flex-shrink-0">
                        {ttsSupported && (
                          <button
                            onClick={(e) => handleSpeakNotification(n, e)}
                            className="p-1 rounded transition-colors"
                            style={{
                              backgroundColor: speakingId === n.id ? 'color-mix(in srgb, var(--accent-purple) 20%, transparent)' : 'transparent',
                              color: speakingId === n.id ? 'var(--accent-purple)' : 'var(--text-3)',
                            }}
                            onMouseEnter={(e) => {
                              if (speakingId !== n.id) {
                                (e.target as HTMLElement).style.backgroundColor = 'color-mix(in srgb, var(--accent-purple) 10%, transparent)';
                                (e.target as HTMLElement).style.color = 'var(--accent-purple)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (speakingId !== n.id) {
                                (e.target as HTMLElement).style.backgroundColor = 'transparent';
                                (e.target as HTMLElement).style.color = 'var(--text-3)';
                              }
                            }}
                            title={speakingId === n.id ? 'Detener lectura' : 'Leer notificación'}
                          >
                            {speakingId === n.id ? '⏹' : '🔊'}
                          </button>
                        )}
                        {!n.is_read && (
                          <button
                            onClick={(e) => markAsRead(n.id, e)}
                            className="p-1 text-text-3 rounded transition-colors"
                            style={{ color: 'var(--text-3)' }}
                            onMouseEnter={(e) => {
                              (e.target as HTMLElement).style.backgroundColor = 'color-mix(in srgb, var(--accent-teal-dark) 10%, transparent)';
                              (e.target as HTMLElement).style.color = 'var(--accent-teal-dark)';
                            }}
                            onMouseLeave={(e) => {
                              (e.target as HTMLElement).style.backgroundColor = 'transparent';
                              (e.target as HTMLElement).style.color = 'var(--text-3)';
                            }}
                            title="Marcar como leída"
                          >
                            ✓
                          </button>
                        )}
                        <button
                          onClick={(e) => deleteNotification(n.id, e)}
                          className="p-1 text-text-3 rounded transition-colors"
                          style={{ color: 'var(--text-3)' }}
                          onMouseEnter={(e) => {
                            (e.target as HTMLElement).style.backgroundColor = 'color-mix(in srgb, rgb(231 76 60) 10%, transparent)';
                            (e.target as HTMLElement).style.color = 'rgb(231 76 60)';
                          }}
                          onMouseLeave={(e) => {
                            (e.target as HTMLElement).style.backgroundColor = 'transparent';
                            (e.target as HTMLElement).style.color = 'var(--text-3)';
                          }}
                          title="Eliminar"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
