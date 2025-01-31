import { createContext, useContext, useEffect, useState } from 'react';
import { themes, ThemeName, ThemeColors } from './themes';
import { useAuth } from '../Auth/AuthContext';
import { db } from '../Database/db';
import { doc, getDoc } from 'firebase/firestore';
import { db as firestore } from '../Auth/firebase';

type Theme = 'light' | 'dark';

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
  
  // Only apply theme colors if not using default theme
  if (themeName !== 'default') {
    const themeColors = themes[themeName][mode];
    root.setAttribute('data-theme', themeName);
    
    Object.entries(themeColors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
  } else {
    // Clear any custom theme colors
    Object.keys(themes.default[mode]).forEach((key) => {
      root.style.removeProperty(`--${key}`);
    });
  }
};

/**
 *
 * @param root0
 * @param root0.children
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
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
        if (preferences?.colorMode) {
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
    
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Apply theme colors
    applyThemeColors(currentTheme, theme);
    
    // Save to database if user exists
    if (user) {
      updateThemePreferences(theme, currentTheme);
    }
  }, [theme, currentTheme, user]);

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  const handleSetCurrentTheme = (newTheme: ThemeName) => {
    setCurrentTheme(newTheme);
  };

  return (
    <ThemeContext.Provider 
      value={{ 
        theme, 
        setTheme: handleSetTheme, 
        currentTheme, 
        setCurrentTheme: handleSetCurrentTheme 
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

/**
 *
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 