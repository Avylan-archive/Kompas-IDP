import React from 'react';
import { CheckCircle2, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: number;
  title: string;
  description?: string;
  tone?: 'success' | 'info';
}

interface ToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  if (!toast) return null;

  const isSuccess = toast.tone !== 'info';

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 max-w-sm w-[calc(100vw-2rem)] sm:w-auto animate-[fadeSlideUp_220ms_cubic-bezier(0.16,1,0.3,1)]"
    >
      <div className="glass-surface rounded-2xl px-4 py-3.5 flex items-start gap-3 shadow-xl border border-[#3478C7]/25 dark:border-white/15">
        <div
          className={`mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
            isSuccess
              ? 'bg-[#3478C7]/15 text-[#3478C7] dark:bg-[#3478C7]/25 dark:text-[#60A5FA]'
              : 'bg-[#F28C28]/15 text-[#F28C28]'
          }`}
        >
          {isSuccess ? <CheckCircle2 className="w-4 h-4" /> : <Info className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#123B68] dark:text-[#F1F5F9] leading-snug">
            {toast.title}
          </p>
          {toast.description && (
            <p className="text-xs text-[#174F85]/80 dark:text-[#A7B6CA] mt-0.5 leading-relaxed">
              {toast.description}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Tutup notifikasi"
          className="w-11 h-11 min-w-[44px] min-h-[44px] -my-1.5 -mr-1.5 rounded-lg flex items-center justify-center text-[#174F85]/60 hover:text-[#123B68] dark:text-[#A7B6CA] dark:hover:text-white hover:bg-[#123B68]/5 dark:hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
