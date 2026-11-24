import React from 'react';
import { Info, X } from 'lucide-react';

interface PrototypeBannerProps {
  visible: boolean;
  onDismiss: () => void;
}

export const PROTOTYPE_DISCLAIMER_TEXT =
  'Prototipe pelatihan. Semua data adalah data dummy, bukan sistem resmi Komdigi.';

export const PrototypeBanner: React.FC<PrototypeBannerProps> = ({
  visible,
  onDismiss,
}) => {
  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Informasi Prototipe"
      className="relative z-10 w-full border-b border-amber-500/25 bg-amber-50/90 dark:bg-[#132642]/90 dark:border-[#F28C28]/25 backdrop-blur-md"
    >
      <div className="max-w-[1280px] mx-auto px-3 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 text-xs text-[#123B68] dark:text-[#E2E8F0]">
          <Info className="w-3.5 h-3.5 text-[#F28C28] shrink-0" aria-hidden="true" />
          <span className="font-medium leading-snug">{PROTOTYPE_DISCLAIMER_TEXT}</span>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Tutup banner prototipe"
          title="Tutup pemberitahuan"
          className="w-11 h-11 min-w-[44px] min-h-[44px] -my-1.5 -mr-2 rounded-lg flex items-center justify-center text-[#123B68]/70 dark:text-[#A7B6CA] hover:bg-[#123B68]/10 dark:hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
