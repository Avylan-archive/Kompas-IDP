import React from 'react';
import { Moon, Sun } from 'lucide-react';

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  onToggle: () => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onToggle }) => {
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? 'Aktifkan Mode Terang' : 'Aktifkan Mode Gelap'}
      title={isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
      className="group relative inline-flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl glass-surface text-[#123B68] dark:text-[#F1F5F9] hover:border-[#3478C7]/40 dark:hover:border-[#5496E4]/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3478C7] transition-all duration-200 shrink-0 cursor-pointer"
    >
      <span className="relative w-5 h-5 flex items-center justify-center overflow-hidden">
        <Sun
          className={`w-[18px] h-[18px] text-[#F28C28] transition-all duration-300 ${
            isDark
              ? 'opacity-0 rotate-90 scale-50 absolute'
              : 'opacity-100 rotate-0 scale-100 relative'
          }`}
          strokeWidth={2.2}
        />
        <Moon
          className={`w-[18px] h-[18px] text-[#60A5FA] transition-all duration-300 ${
            isDark
              ? 'opacity-100 rotate-0 scale-100 relative'
              : 'opacity-0 -rotate-90 scale-50 absolute'
          }`}
          strokeWidth={2.2}
        />
      </span>
    </button>
  );
};
