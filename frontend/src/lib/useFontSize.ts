'use client';

import { useState, useEffect } from 'react';

export type FontSize = 'small' | 'normal' | 'large' | 'extra_large';

interface UseFontSizeReturn {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  isLoading: boolean;
}

const FONT_SIZE_KEY = 'acpm_font_size';

export function useFontSize(): UseFontSizeReturn {
  const [fontSize, setFontSizeState] = useState<FontSize>('normal');
  const [isLoading, setIsLoading] = useState(true);

  // Initialize font size on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Try to get from localStorage first
    const savedFontSize = localStorage.getItem(FONT_SIZE_KEY);
    if (savedFontSize && ['small', 'normal', 'large', 'extra_large'].includes(savedFontSize)) {
      setFontSizeState(savedFontSize as FontSize);
      applyFontSize(savedFontSize as FontSize);
      setIsLoading(false);
      return;
    }

    // Load from API
    async function loadFontSize() {
      try {
        const token = localStorage.getItem('acpm_token');
        if (!token) {
          setIsLoading(false);
          return;
        }

        const res = await fetch('http://localhost:3001/api/user/preferences', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          const size = data.font_size_preference || 'normal';
          if (['small', 'normal', 'large', 'extra_large'].includes(size)) {
            setFontSizeState(size as FontSize);
            localStorage.setItem(FONT_SIZE_KEY, size);
            applyFontSize(size as FontSize);
          }
        }
      } catch (err) {
        console.error('Error loading font size:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadFontSize();
  }, []);

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
    localStorage.setItem(FONT_SIZE_KEY, size);
    applyFontSize(size);
  };

  return {
    fontSize,
    setFontSize,
    isLoading,
  };
}

function applyFontSize(size: FontSize) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-font-size', size);
}
