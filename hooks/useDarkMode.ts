import { useState, useEffect } from 'react';

const DARK_KEY = 'prisma-dark-mode';

export const useDarkMode = () => {
  const [isDark, setIsDark] = useState(() => {
    const cached = localStorage.getItem(DARK_KEY);
    if (cached !== null) return cached === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    localStorage.setItem(DARK_KEY, String(isDark));
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const toggle = () => setIsDark(prev => !prev);

  return { isDark, toggle };
};
