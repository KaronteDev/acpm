import { useEffect, useState, useCallback } from 'react';

export type Theme = 'light' | 'high_contrast' | 'colorblind' | 'dark';

interface UseThemeReturn {
  theme: Theme;
  setTheme: (theme: Theme) => Promise<void>;
  isLoading: boolean;
}

function getSystemTheme(): Theme {
  // Detect system preference for light/dark mode
  // Map to our available themes
  if (typeof window !== 'undefined') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    // For now, keep both system light and dark preferences as our "light" theme
    // since high_contrast is for accessibility, not dark mode
    // Users can manually switch to high_contrast or colorblind if desired
    return 'light';
  }
  return 'light';
}

export function useTheme(): UseThemeReturn {
  const [theme, setThemeState] = useState<Theme>('light');
  const [isLoading, setIsLoading] = useState(true);

  // Load theme from localStorage and/or API on mount
  useEffect(() => {
    const initTheme = async () => {
      try {
        // First try localStorage (faster)
        const savedTheme = localStorage.getItem('theme-preference') as Theme | null;
        if (savedTheme && ['light', 'high_contrast', 'colorblind', 'dark'].includes(savedTheme)) {
          setThemeState(savedTheme);
          document.documentElement.setAttribute('data-theme', savedTheme);
          setIsLoading(false);
          return;
        }

        // Then try API
        const response = await fetch('/api/user/preferences', {
          credentials: 'include',
        });

        if (response.ok) {
          const { theme_preference } = await response.json();
          if (theme_preference && ['light', 'high_contrast', 'colorblind', 'dark'].includes(theme_preference)) {
            setThemeState(theme_preference);
            document.documentElement.setAttribute('data-theme', theme_preference);
            localStorage.setItem('theme-preference', theme_preference);
            setIsLoading(false);
            return;
          }
        }

        // Fallback: Use system preference if no stored preference
        const systemTheme = getSystemTheme();
        setThemeState(systemTheme);
        document.documentElement.setAttribute('data-theme', systemTheme);
        localStorage.setItem('theme-preference', systemTheme);
      } catch (error) {
        console.error('Error loading theme:', error);
        // On error, use system preference as fallback
        const systemTheme = getSystemTheme();
        setThemeState(systemTheme);
        document.documentElement.setAttribute('data-theme', systemTheme);
      } finally {
        setIsLoading(false);
      }
    };

    initTheme();
  }, []);

  // Apply theme to DOM when it changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const setTheme = useCallback(async (newTheme: Theme) => {
    try {
      // Update API
      const response = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ theme_preference: newTheme }),
      });

      if (response.ok) {
        setThemeState(newTheme);
        localStorage.setItem('theme-preference', newTheme);
      } else {
        throw new Error('Failed to update theme preference');
      }
    } catch (error) {
      console.error('Error saving theme:', error);
      // Still update local state even if API fails
      setThemeState(newTheme);
      localStorage.setItem('theme-preference', newTheme);
    }
  }, []);

  // Listen for system theme changes (when user changes OS preferences)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      // Only apply system change if user hasn't manually set a theme
      const savedTheme = localStorage.getItem('theme-preference');
      if (!savedTheme) {
        const systemTheme = getSystemTheme();
        setThemeState(systemTheme);
        document.documentElement.setAttribute('data-theme', systemTheme);
      }
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    // Legacy
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return { theme, setTheme, isLoading };
}
