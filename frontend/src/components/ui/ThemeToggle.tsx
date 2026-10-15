'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';

export interface ThemeToggleProps {
  className?: string;
  variant?: 'button' | 'icon';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className,
  variant = 'icon',
}) => {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let mountedActive = true;
    Promise.resolve().then(() => {
      if (mountedActive) setMounted(true);
    });
    return () => {
      mountedActive = false;
    };
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn(
          'w-8 h-8 rounded-lg border border-surface-200 bg-surface-0 flex items-center justify-center opacity-60',
          className
        )}
        aria-hidden="true"
      >
        <span className="w-4 h-4" />
      </div>
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'group relative inline-flex items-center justify-center rounded-lg border border-surface-200 bg-surface-0 p-2 text-surface-600 hover:text-surface-900 hover:bg-surface-100 hover:border-surface-300 transition-all cursor-pointer shadow-2xs',
        variant === 'button' && 'gap-2 px-3 py-1.5 text-xs font-semibold',
        className
      )}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-500 transition-transform group-hover:rotate-45" />
      ) : (
        <Moon className="h-4 w-4 text-surface-600 transition-transform group-hover:-rotate-12 group-hover:text-brand-600" />
      )}

      {variant === 'button' && (
        <span className="hidden sm:inline">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
};
