import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

interface GlassSelectProps {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  className?: string;
  placement?: 'bottom' | 'top';
}

export const GlassSelect: React.FC<GlassSelectProps> = ({
  label,
  value,
  options,
  onChange,
  className = '',
  placement = 'bottom',
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full h-11 pl-4 pr-4 rounded-2xl glass-input flex items-center justify-between gap-3 text-sm font-medium text-[#123B68] dark:text-[#F1F5F9] cursor-pointer transition-all ${
          open ? 'border-[#3478C7] ring-3 ring-[#3478C7]/18 dark:border-[#5496E4]' : ''
        }`}
      >
        <span className="truncate">{value}</span>
        <ChevronDown
          aria-hidden="true"
          className={`w-4 h-4 text-[#174F85]/75 dark:text-[#A7B6CA] shrink-0 transition-transform duration-200 ${
            open ? 'rotate-180 text-[#3478C7] dark:text-[#60A5FA]' : ''
          }`}
        />
      </button>

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={label}
          className={`absolute left-0 right-0 md:left-auto md:min-w-[230px] md:w-max md:max-w-[300px] ${
            placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          } z-50 rounded-2xl p-1.5 shadow-2xl border border-white/80 dark:border-white/15 bg-white/95 dark:bg-[#132642]/95 backdrop-blur-xl max-h-64 overflow-y-auto animate-[fadeSlideUp_150ms_cubic-bezier(0.16,1,0.3,1)]`}
        >
          {options.map((option) => {
            const isSelected = option === value;
            return (
              <li key={option} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                  className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-left text-sm flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#3478C7] text-white font-semibold shadow-sm'
                      : 'text-[#123B68] dark:text-[#E2E8F0] hover:bg-[#EAF2FC] dark:hover:bg-white/10 font-medium'
                  }`}
                >
                  <span className="truncate">{option}</span>
                  {isSelected && <Check className="w-4 h-4 shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
