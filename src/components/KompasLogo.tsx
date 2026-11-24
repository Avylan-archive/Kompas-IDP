import React, { useState } from 'react';

interface KompasLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_MAP: Record<NonNullable<KompasLogoProps['size']>, string> = {
  sm: 'w-9 h-9',
  md: 'w-11 h-11',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

export const KompasLogo: React.FC<KompasLogoProps> = ({ size = 'md', className = '' }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${SIZE_MAP[size]} ${className}`}
    >
      {!imgError ? (
        <img
          src="/assets/kompas-logo-transparent.png"
          alt="Logo KOMPAS — Kompas bundar 3D jarum oranye dan abu-abu gelap"
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
          className="w-full h-full object-contain drop-shadow-[0_4px_10px_rgba(10,25,47,0.28)]"
        />
      ) : (
        /* Faithful isometric 3D compass fallback matching reference geometry */
        <svg
          viewBox="0 0 120 100"
          className="w-full h-full drop-shadow-[0_4px_10px_rgba(10,25,47,0.28)]"
          aria-label="Logo KOMPAS"
        >
          <path
            d="M12 46 C12 68 33 84 60 84 C87 84 108 68 108 46 L108 58 C108 78 87 94 60 94 C33 94 12 78 12 58 Z"
            fill="#3B4249"
          />
          <path
            d="M60 84 C74 84 87 79 96 71 L96 82 C87 89 74 94 60 94 Z"
            fill="#505860"
          />
          <ellipse cx="60" cy="46" rx="48" ry="34" fill="#636C75" />
          <ellipse cx="60" cy="45" rx="40" ry="27" fill="#E9EDF2" />
          <ellipse cx="60" cy="46" rx="36" ry="24" fill="#F8FAFC" />
          {/* 8-point compass rose */}
          <polygon points="60,24 63,43 60,46 57,43" fill="#CBD5E1" />
          <polygon points="60,68 63,49 60,46 57,49" fill="#CBD5E1" />
          <polygon points="28,46 57,43 60,46 57,49" fill="#CBD5E1" />
          <polygon points="92,46 63,43 60,46 63,49" fill="#CBD5E1" />
          {/* Orange & Dark Grey Isometric Needle */}
          <polygon points="60,41 86,32 63,49" fill="#F28C28" />
          <polygon points="60,41 34,60 57,49" fill="#2B3137" />
          <ellipse cx="60" cy="45.5" rx="4.5" ry="3.2" fill="#FFFFFF" />
        </svg>
      )}
    </div>
  );
};
