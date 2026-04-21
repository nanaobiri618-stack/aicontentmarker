'use client';

import { useTheme } from 'next-themes';
import { MoonIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

export function ThemeToggle({ fullWidth = false }: { fullWidth?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Force dark theme on mount
    setTheme('dark');
  }, [setTheme]);

  if (!mounted) return <div className="w-6 h-6" />; // prevent hydration mismatch

  const btnContent = (
    <>
      <MoonIcon className="w-5 h-5 flex-shrink-0" />
      {fullWidth && (
        <span className="font-medium">Dark Mode</span>
      )}
    </>
  );

  return (
    <button
      onClick={() => setTheme('dark')}
      className={`flex items-center gap-4 transition-colors duration-200 ${
        fullWidth
          ? 'w-full px-4 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:text-cyber-blue hover:dark:text-white hover:bg-slate-100 hover:dark:bg-white/5'
          : 'p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-cyber-blue hover:dark:text-white bg-transparent hover:bg-slate-100 hover:dark:bg-white/5'
      }`}
      aria-label="Dark mode"
    >
      {btnContent}
    </button>
  );
}
