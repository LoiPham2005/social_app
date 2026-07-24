'use client';

import { useEffect, useState } from 'react';
import { getStoredTheme, setTheme, type Theme } from '@/lib/theme';

const ORDER: Theme[] = ['light', 'dark', 'system'];
const ICON: Record<Theme, string> = {
  light: '☀️',
  dark: '🌙',
  system: '🖥️',
};
const LABEL: Record<Theme, string> = {
  light: 'Sáng',
  dark: 'Tối',
  system: 'Hệ thống',
};

export function ThemeToggle() {
  const [theme, setThemeState] = useState<Theme>('system');

  useEffect(() => {
    setThemeState(getStoredTheme());
  }, []);

  function cycle() {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length];
    setThemeState(next);
    setTheme(next);
  }

  return (
    <button
      onClick={cycle}
      title={`Giao diện: ${LABEL[theme]}`}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-lg transition hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
    >
      {ICON[theme]}
    </button>
  );
}
