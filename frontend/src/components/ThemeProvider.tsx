'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useTheme } from '@/lib/useTheme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { theme, isLoading } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Apply theme to document on load and change
    if (!isLoading && mounted) {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme, isLoading, mounted]);

  // Mark as mounted to ensure hydration matches
  useEffect(() => {
    setMounted(true);
  }, []);

  return <>{children}</>;
}
