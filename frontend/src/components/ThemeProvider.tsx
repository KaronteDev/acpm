'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useTheme } from '@/lib/useTheme';
import { useFontSize } from '@/lib/useFontSize';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { theme, isLoading } = useTheme();
  const { fontSize, isLoading: fontSizeLoading } = useFontSize();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Apply theme to document on load and change
    if (!isLoading && mounted) {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme, isLoading, mounted]);

  useEffect(() => {
    // Apply font size to document on load and change
    if (!fontSizeLoading && mounted) {
      document.documentElement.setAttribute('data-font-size', fontSize);
    }
  }, [fontSize, fontSizeLoading, mounted]);

  // Mark as mounted to ensure hydration matches
  useEffect(() => {
    setMounted(true);
  }, []);

  return <>{children}</>;
}
