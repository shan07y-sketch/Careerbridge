import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * Shared light/dark theme switch. Drops into any portal's chrome (desktop
 * sidebar, mobile "More" sheet, settings). Reads and writes the single
 * ThemeProvider, so every portal stays in sync and the choice persists
 * (localStorage) across sessions and reloads.
 */
export const ThemeToggle: React.FC<{ variant?: 'row' | 'icon' }> = ({ variant = 'row' }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  if (variant === 'icon') {
    return (
      <button
        onClick={toggleTheme}
        aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        title={isDark ? 'Light mode' : 'Dark mode'}
        className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
        type="button"
      >
        <span className="material-symbols-outlined text-[20px]">{isDark ? 'light_mode' : 'dark_mode'}</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors"
      type="button"
    >
      <span className="material-symbols-outlined text-[21px]">{isDark ? 'dark_mode' : 'light_mode'}</span>
      <span className="flex-1 text-left text-label-md">Appearance</span>
      <span className="text-[12px] font-semibold text-on-surface-variant">{isDark ? 'Dark' : 'Light'}</span>
    </button>
  );
};
