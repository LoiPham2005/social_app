export type Theme = 'light' | 'dark' | 'system';

const KEY = 'social.theme';

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  return (localStorage.getItem(KEY) as Theme) || 'system';
}

export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = theme === 'dark' || (theme === 'system' && prefersDark);
  document.documentElement.classList.toggle('dark', dark);
}

export function setTheme(theme: Theme): void {
  localStorage.setItem(KEY, theme);
  applyTheme(theme);
}

/** Script chạy sớm (trong <head>) để set class trước khi paint, tránh nhấp nháy. */
export const themeInitScript = `
(function(){try{
  var t = localStorage.getItem('${KEY}') || 'system';
  var d = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', d);
}catch(e){}})();
`;
