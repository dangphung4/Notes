import { createContext, useContext, useEffect, useState } from 'react';
import { themes, ThemeName } from './themes';
import { useAuth } from '../Auth/AuthContext';
import { db } from '../Database/db';
import { doc, getDoc } from 'firebase/firestore';
import { db as firestore } from '../Auth/firebase';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  currentTheme: ThemeName;
  setCurrentTheme: (theme: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const applyThemeColors = (themeName: ThemeName, mode: Theme) => {
  const root = document.documentElement;
  
  // Remove any existing theme
  root.removeAttribute('data-theme');
  
  // Only apply theme colors if not using default theme and theme exists
  if (themeName !== 'default' && themes[themeName]) {
    const themeColors = themes[themeName][mode === 'system' ? 'light' : mode];
    if (themeColors) {
      root.setAttribute('data-theme', themeName);
      
      Object.entries(themeColors).forEach(([key, value]) => {
        root.style.setProperty(`--${key}`, value);
      });
    }
  } else {
    // Clear any custom theme colors if theme doesn't exist
    const defaultColors = themes.default[mode === 'system' ? 'light' : mode];
    if (defaultColors) {
      Object.keys(defaultColors).forEach((key) => {
        root.style.removeProperty(`--${key}`);
      });
    }
  }
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      return savedTheme;
    }
    return 'system';
  });

  const [currentTheme, setCurrentTheme] = useState<ThemeName>(() => {
    const saved = localStorage.getItem('currentTheme') as ThemeName;
    return saved || 'default';
  });

  // Load user preferences from database
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(firestore, 'users', user.uid));
        const preferences = userDoc.data()?.preferences;
        if (preferences?.theme) {
          setCurrentTheme(preferences.theme as ThemeName);
        }
        if (preferences?.colorMode && ['light', 'dark', 'system'].includes(preferences.colorMode)) {
          setTheme(preferences.colorMode as Theme);
        }
      } catch (error) {
        console.error('Error loading theme preferences:', error);
      }
    };
    
    loadPreferences();
  }, [user]);

  // Save theme preferences to database
  const updateThemePreferences = async (newTheme: Theme, newCurrentTheme: ThemeName) => {
    if (!user) return;
    try {
      await db.updateUserPreferences(user.uid, {
        theme: newCurrentTheme,
        colorMode: newTheme
      });
    } catch (error) {
      console.error('Error saving theme preferences:', error);
    }
  };

  useEffect(() => {
    localStorage.setItem('theme', theme);
    localStorage.setItem('currentTheme', currentTheme);
    
    const root = document.documentElement;
    root.classList.remove('light', 'dark');

    let effectiveTheme = theme;
    if (theme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    root.classList.add(effectiveTheme);
    
    // Apply theme colors with the effective theme
    applyThemeColors(currentTheme, effectiveTheme);
    
    // Save to database if user exists
    if (user) {
      updateThemePreferences(theme, currentTheme);
    }
  }, [theme, currentTheme, user]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        const newTheme = e.matches ? 'dark' : 'light';
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(newTheme);
        applyThemeColors(currentTheme, newTheme);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, currentTheme]);

  const value = {
    theme,
    setTheme,
    currentTheme,
    setCurrentTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 