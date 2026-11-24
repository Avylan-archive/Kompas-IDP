import React, { useEffect } from 'react';
import { BookOpen, Calendar, Check, Clock, Layers, Plus, X } from 'lucide-react';
import { TrainingProgram } from '../types/kompas';

interface TrainingDetailModalProps {
  training: TrainingProgram | null;
  isInIdp: boolean;
  onClose: () => void;
  onToggleIdp: (training: TrainingProgram) => void;
}

export const TrainingDetailModal: React.FC<TrainingDetailModalProps> = ({
  training,
  isInIdp,
  onClose,
  onToggleIdp,
}) => {
  useEffect(() => {
    if (!training) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [training, onClose]);

  if (!training) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#123B68]/30 dark:bg-[#0B1628]/70 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-training-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl p-6 sm:p-7 max-h-[88vh] overflow-y-auto bg-white/95 dark:bg-[#132642]/95 backdrop-blur-xl border border-white dark:border-white/15 shadow-[0_24px_60px_-12px_rgba(18,59,104,0.24)] dark:shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#174F85]/80 dark:text-[#A7B6CA]">
              <span className="font-mono font-bold text-[#123B68] dark:text-[#F1F5F9]">
                {training.code}
              </span>
              <span aria-hidden="true">·</span>
              <span>{training.type}</span>
              <span aria-hidden="true">·</span>
              <span>{training.category}</span>
              <span aria-hidden="true">·</span>
              <span>Level {training.level}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{training.durationJp} JP</span>
            </div>
            <h2
              id="modal-training-title"
              className="mt-2 text-xl sm:text-2xl font-bold text-[#123B68] dark:text-[#F1F5F9] leading-snug text-balance"
            >
              {training.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup detail pelatihan"
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-[#123B68]/70 dark:text-[#A7B6CA] hover:bg-[#123B68]/10 dark:hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="mt-4 text-sm sm:text-[15px] leading-relaxed text-[#123B68]/85 dark:text-[#CBD5E1]">
          {training.summary}
        </p>

        {/* Key Metadata Row */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-[#123B68]/10 dark:border-white/12">
          <div className="flex items-center gap-2.5 text-sm">
            <Layers className="w-4 h-4 text-[#3478C7] dark:text-[#60A5FA] shrink-0" />
            <div>
              <p className="text-[11px] text-[#174F85]/70 dark:text-[#A7B6CA]">Metode</p>
              <p className="font-semibold text-[#123B68] dark:text-[#F1F5F9]">{training.method}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 text-sm">
            <Clock className="w-4 h-4 text-[#3478C7] dark:text-[#60A5FA] shrink-0" />
            <div>
              <p className="text-[11px] text-[#174F85]/70 dark:text-[#A7B6CA]">Beban Belajar</p>
              <p className="font-semibold font-mono tabular-nums text-[#123B68] dark:text-[#F1F5F9]">
                {training.durationJp} Jam Pelajaran
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 text-sm">
            <Calendar className="w-4 h-4 text-[#F28C28] shrink-0" />
            <div>
              <p className="text-[11px] text-[#174F85]/70 dark:text-[#A7B6CA]">Estimasi Jadwal</p>
              <p className="font-semibold text-[#123B68] dark:text-[#F1F5F9]">
                {training.scheduleEstimate}
              </p>
            </div>
          </div>
        </div>

        {/* Recommendation Context */}
        <div className="mt-5 p-4 rounded-xl bg-gradient-to-br from-[#D9EAFE] via-[#E5F0FD] to-[#EEF5FE] dark:from-[#1B3963] dark:to-[#132B4D] border border-[#3478C7]/35 dark:border-[#60A5FA]/35 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-[#123B68] dark:text-[#F1F5F9]">
              Tingkat Kesesuaian Profil: {training.matchLevel}
            </span>
            <span className="font-mono text-xs font-bold tabular-nums px-2.5 py-0.5 rounded-lg bg-[#3478C7] text-white shadow-xs">
              {training.matchPercentage}%
            </span>
          </div>
          <div className="mt-2.5 relative h-1.5 w-full rounded-full bg-[#3478C7]/20 dark:bg-white/15 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#174F85] to-[#3478C7] dark:from-[#3478C7] dark:to-[#60A5FA]"
              style={{ width: `${training.matchPercentage}%` }}
            />
            {training.matchPercentage >= 90 && (
              <span
                aria-hidden="true"
                className="absolute top-0 bottom-0 w-1 bg-[#F28C28] rounded-full"
                style={{ left: `calc(${training.matchPercentage}% - 2px)` }}
              />
            )}
          </div>
          <p className="mt-2.5 text-xs text-[#123B68]/85 dark:text-[#CBD5E1] leading-relaxed">
            {training.recommendationReason}
          </p>
        </div>

        {/* Syllabus */}
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-[#123B68] dark:text-[#F1F5F9] flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#3478C7] dark:text-[#60A5FA]" />
            <span>Materi Pokok Pelatihan</span>
          </h3>
          <ul className="mt-3 space-y-2">
            {training.syllabus.map((topic, index) => (
              <li
                key={topic}
                className="flex items-start gap-3 text-sm text-[#123B68]/85 dark:text-[#CBD5E1]"
              >
                <span className="font-mono text-xs tabular-nums text-[#3478C7] dark:text-[#60A5FA] mt-0.5 shrink-0">
                  0{index + 1}.
                </span>
                <span>{topic}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-[#174F85]/75 dark:text-[#A7B6CA]">
            Penyelenggara: {training.provider}
          </p>
        </div>

        {/* Actions */}
        <div className="mt-6 pt-4 border-t border-[#123B68]/10 dark:border-white/12 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-5 rounded-xl text-sm font-semibold text-[#123B68] dark:text-[#F1F5F9] hover:bg-[#123B68]/8 dark:hover:bg-white/10 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={() => onToggleIdp(training)}
            className={`h-11 px-5 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              isInIdp
                ? 'bg-[#123B68]/10 dark:bg-white/10 text-[#123B68] dark:text-[#F1F5F9] hover:bg-[#123B68]/15 dark:hover:bg-white/15'
                : 'bg-[#3478C7] hover:bg-[#2B67AD] text-white shadow-md shadow-[#3478C7]/25'
            }`}
          >
            {isInIdp ? (
              <>
                <Check className="w-4 h-4 text-[#F28C28]" />
                <span>Tersimpan di IDP (Hapus)</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Tambah ke IDP</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
