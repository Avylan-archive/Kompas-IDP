import React, { useEffect, useState } from 'react';
import { BookPlus, Loader2, Send, Save, X } from 'lucide-react';
import { JABATAN_FILTER_OPTIONS, KOMPETENSI_FILTER_OPTIONS } from '../data/mockKompasData';
import {
  CatalogApprovalStatus,
  DeliveryMethod,
  TrainingLevel,
  TrainingProgram,
  TrainingType,
} from '../types/kompas';

interface AddCatalogTrainingModalProps {
  isOpen: boolean;
  existingIds: string[];
  creatorUid: string;
  creatorName: string;
  isAdmin?: boolean;
  onClose: () => void;
  onSubmit: (training: TrainingProgram) => Promise<void>;
}

const COMPETENCY_OPTIONS = KOMPETENSI_FILTER_OPTIONS.filter(
  (c) => c !== 'Semua Kompetensi'
);

const ROLE_OPTIONS = JABATAN_FILTER_OPTIONS;

function suggestNextCode(existingIds: string[]): string {
  const taken = new Set(existingIds.map((id) => id.toUpperCase()));
  let idx = existingIds.length + 1;
  while (taken.has(`PL-${String(idx).padStart(2, '0')}`)) {
    idx += 1;
  }
  return `PL-${String(idx).padStart(2, '0')}`;
}

export const AddCatalogTrainingModal: React.FC<AddCatalogTrainingModalProps> = ({
  isOpen,
  existingIds,
  creatorUid,
  creatorName,
  isAdmin = false,
  onClose,
  onSubmit,
}) => {
  const [code, setCode] = useState(() => suggestNextCode(existingIds));
  const [title, setTitle] = useState('');
  const [type, setType] = useState<TrainingType>('Pelatihan');
  const [category, setCategory] = useState<string>(COMPETENCY_OPTIONS[0] || 'Keamanan Informasi');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['Semua Jabatan']);
  const [method, setMethod] = useState<DeliveryMethod>('Daring');
  const [level, setLevel] = useState<TrainingLevel>('Menengah');
  const [durationJp, setDurationJp] = useState<string>('16');
  const [provider, setProvider] = useState('');
  const [scheduleEstimate, setScheduleEstimate] = useState('Triwulan III 2026');
  const [summary, setSummary] = useState('');
  const [syllabusText, setSyllabusText] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [submittingMode, setSubmittingMode] = useState<'draft' | 'admin' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wasOpenRef = React.useRef(false);

  const submitting = submittingMode !== null;

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      setCode(suggestNextCode(existingIds));
      setTitle('');
      setType('Pelatihan');
      setCategory(COMPETENCY_OPTIONS[0] || 'Keamanan Informasi');
      setSelectedRoles(['Semua Jabatan']);
      setMethod('Daring');
      setLevel('Menengah');
      setDurationJp('16');
      setProvider('');
      setScheduleEstimate('Triwulan III 2026');
      setSummary('');
      setSyllabusText('');
      setAdminNote('');
      setSubmittingMode(null);
      setError(null);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, existingIds]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, submitting, onClose]);

  if (!isOpen) return null;

  const handleToggleRole = (role: string) => {
    if (role === 'Semua Jabatan') {
      setSelectedRoles(['Semua Jabatan']);
      return;
    }

    setSelectedRoles((prev) => {
      const withoutAll = prev.filter((r) => r !== 'Semua Jabatan');
      const exists = withoutAll.includes(role);
      const next = exists
        ? withoutAll.filter((r) => r !== role)
        : [...withoutAll, role];
      return next.length === 0 ? ['Semua Jabatan'] : next;
    });
  };

  const submitWithStatus = async (targetStatus: CatalogApprovalStatus) => {
    const cleanCode = code.trim().toUpperCase();
    const cleanTitle = title.trim();
    const cleanProvider = provider.trim() || 'Pengembangan Kompetensi Mandiri ASN';
    const cleanSchedule = scheduleEstimate.trim() || 'Triwulan III 2026';
    const cleanSummary = summary.trim();
    const cleanAdminNote = adminNote.trim();
    const parsedJp = Number(durationJp);

    if (!cleanCode) {
      setError('Kode pelatihan wajib diisi.');
      return;
    }
    if (!cleanTitle) {
      setError('Judul pelatihan wajib diisi.');
      return;
    }
    if (!Number.isFinite(parsedJp) || parsedJp < 1 || parsedJp > 500) {
      setError('Durasi JP harus antara 1 hingga 500.');
      return;
    }
    if (!cleanSummary) {
      setError('Ringkasan pelatihan wajib diisi.');
      return;
    }
    if (targetStatus === 'Menunggu Persetujuan Admin' && !cleanAdminNote) {
      setError('Catatan pengajuan ke Admin wajib diisi.');
      return;
    }

    const safeCodeSlug = cleanCode
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
    const targetId = (safeCodeSlug || `PL-${Date.now().toString(36)}`).slice(0, 64);

    if (existingIds.some((id) => id.toLowerCase() === targetId.toLowerCase())) {
      setError(
        `Kode / ID pelatihan "${targetId}" sudah ada di katalog. Hapus pelatihan tersebut terlebih dahulu atau gunakan kode lain.`
      );
      return;
    }

    const parsedSyllabus = syllabusText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 20);

    const finalSyllabus =
      parsedSyllabus.length > 0 ? parsedSyllabus : [`Materi Pokok ${cleanTitle}`];

    const submittedAt =
      targetStatus === 'Menunggu Persetujuan Admin'
        ? new Date().toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : null;

    const catalogInstanceId = `${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2, 7)}`;

    const newTraining: TrainingProgram = {
      id: targetId,
      code: cleanCode.slice(0, 20),
      title: cleanTitle.slice(0, 200),
      type,
      category,
      targetRole: selectedRoles.join(', ').slice(0, 160),
      targetRoles: selectedRoles.slice(0, 10),
      durationJp: Math.round(parsedJp),
      method,
      level,
      provider: cleanProvider.slice(0, 200),
      matchPercentage: 80,
      matchLevel: 'Direkomendasikan',
      summary: cleanSummary.slice(0, 1000),
      recommendationReason: isAdmin
        ? 'Ditambahkan oleh Admin KOMPAS ke koleksi katalog pelatihan resmi.'
        : 'Ditambahkan secara mandiri oleh Ahli Utama ke koleksi katalog pelatihan.',
      syllabus: finalSyllabus,
      scheduleEstimate: cleanSchedule.slice(0, 100),
      createdByUid: creatorUid.slice(0, 128),
      createdByName: creatorName.slice(0, 160),
      approvalStatus: targetStatus,
      adminNote: cleanAdminNote.slice(0, 500),
      submittedToAdminAt: submittedAt,
      catalogInstanceId,
    };

    setError(null);
    setSubmittingMode(
      targetStatus === 'Belum Diajukan' ? 'draft' : 'admin'
    );
    try {
      await onSubmit(newTraining);
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Gagal menyimpan pelatihan baru ke katalog.'
      );
    } finally {
      setSubmittingMode(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitWithStatus(isAdmin ? 'Disetujui' : 'Menunggu Persetujuan Admin');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#123B68]/30 dark:bg-[#0B1628]/75 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-catalog-modal-title"
      onClick={() => {
        if (!submitting) onClose();
      }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl p-6 sm:p-7 max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-[#132642]/95 backdrop-blur-xl border border-white dark:border-white/15 shadow-[0_24px_60px_-12px_rgba(18,59,104,0.24)] dark:shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#123B68]/10 dark:border-white/12">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#3478C7]/12 dark:bg-[#3478C7]/25 text-[#3478C7] dark:text-[#60A5FA] flex items-center justify-center shrink-0">
              <BookPlus className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2
                id="add-catalog-modal-title"
                className="text-lg sm:text-xl font-bold text-[#123B68] dark:text-[#F1F5F9]"
              >
                {isAdmin
                  ? 'Tambah Katalog Pelatihan (Admin)'
                  : 'Tambah Katalog Pelatihan Mandiri'}
              </h2>
              <p className="text-xs text-[#174F85]/75 dark:text-[#A7B6CA] mt-0.5">
                {isAdmin
                  ? 'Tambahkan pelatihan atau sertifikasi baru yang langsung terbit ke katalog dan siap ditugaskan.'
                  : 'Usulkan pelatihan atau sertifikasi baru ke koleksi katalog bersama.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Tutup formulir tambah pelatihan"
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-[#123B68]/70 dark:text-[#A7B6CA] hover:bg-[#123B68]/10 dark:hover:bg-white/10 transition-colors shrink-0 cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label
                htmlFor="catalog-code"
                className="block text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] mb-1"
              >
                Kode Pelatihan
              </label>
              <input
                id="catalog-code"
                type="text"
                maxLength={20}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="PL-11"
                className="w-full h-10 px-3.5 rounded-xl glass-input font-mono text-sm text-[#123B68] dark:text-[#F1F5F9]"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="catalog-title"
                className="block text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] mb-1"
              >
                Judul Pelatihan / Sertifikasi
              </label>
              <input
                id="catalog-title"
                type="text"
                maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Arsitektur Cloud Pemerintahan"
                className="w-full h-10 px-3.5 rounded-xl glass-input text-sm text-[#123B68] dark:text-[#F1F5F9]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                htmlFor="catalog-type"
                className="block text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] mb-1"
              >
                Jenis Program
              </label>
              <select
                id="catalog-type"
                value={type}
                onChange={(e) => setType(e.target.value as TrainingType)}
                className="w-full h-10 px-3.5 rounded-xl glass-input text-sm text-[#123B68] dark:text-[#F1F5F9]"
              >
                <option value="Pelatihan">Pelatihan</option>
                <option value="Sertifikasi">Sertifikasi</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="catalog-category"
                className="block text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] mb-1"
              >
                Kompetensi
              </label>
              <select
                id="catalog-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl glass-input text-sm text-[#123B68] dark:text-[#F1F5F9]"
              >
                {COMPETENCY_OPTIONS.map((comp) => (
                  <option key={comp} value={comp}>
                    {comp}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label
                htmlFor="catalog-method"
                className="block text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] mb-1"
              >
                Mode Pelaksanaan
              </label>
              <select
                id="catalog-method"
                value={method}
                onChange={(e) => setMethod(e.target.value as DeliveryMethod)}
                className="w-full h-10 px-3.5 rounded-xl glass-input text-sm text-[#123B68] dark:text-[#F1F5F9]"
              >
                <option value="Daring">Daring</option>
                <option value="Luring">Luring</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="catalog-level"
                className="block text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] mb-1"
              >
                Tingkat / Level
              </label>
              <select
                id="catalog-level"
                value={level}
                onChange={(e) => setLevel(e.target.value as TrainingLevel)}
                className="w-full h-10 px-3.5 rounded-xl glass-input text-sm text-[#123B68] dark:text-[#F1F5F9]"
              >
                <option value="Dasar">Dasar</option>
                <option value="Menengah">Menengah</option>
                <option value="Lanjut">Lanjut</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="catalog-jp"
                className="block text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] mb-1"
              >
                Durasi (JP)
              </label>
              <input
                id="catalog-jp"
                type="number"
                min={1}
                max={500}
                value={durationJp}
                onChange={(e) => setDurationJp(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl glass-input font-mono text-sm text-[#123B68] dark:text-[#F1F5F9]"
                required
              />
            </div>
          </div>

          <div>
            <p className="block text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] mb-1.5">
              Jabatan Sasaran
            </p>
            <div className="flex flex-wrap gap-2">
              {ROLE_OPTIONS.map((role) => {
                const active = selectedRoles.includes(role);
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleToggleRole(role)}
                    className={`min-h-[44px] h-11 px-3.5 rounded-xl text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-[#3478C7] border-[#3478C7] text-white shadow-sm'
                        : 'glass-surface text-[#123B68] dark:text-[#CBD5E1] border-[#123B68]/15 dark:border-white/15 hover:border-[#3478C7]/45'
                    }`}
                  >
                    {role}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                htmlFor="catalog-provider"
                className="block text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] mb-1"
              >
                Penyelenggara
              </label>
              <input
                id="catalog-provider"
                type="text"
                maxLength={200}
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                placeholder="Contoh: Pusat Pendidikan TI ASN"
                className="w-full h-10 px-3.5 rounded-xl glass-input text-sm text-[#123B68] dark:text-[#F1F5F9]"
              />
            </div>

            <div>
              <label
                htmlFor="catalog-schedule"
                className="block text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] mb-1"
              >
                Estimasi Jadwal
              </label>
              <input
                id="catalog-schedule"
                type="text"
                maxLength={100}
                value={scheduleEstimate}
                onChange={(e) => setScheduleEstimate(e.target.value)}
                placeholder="Triwulan III 2026"
                className="w-full h-10 px-3.5 rounded-xl glass-input text-sm text-[#123B68] dark:text-[#F1F5F9]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="catalog-summary"
              className="block text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] mb-1"
            >
              Ringkasan Pelatihan
            </label>
            <textarea
              id="catalog-summary"
              rows={3}
              maxLength={1000}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Jelaskan cakupan pembelajaran dan manfaat pelatihan bagi pegawai..."
              className="w-full p-3.5 rounded-xl glass-input text-sm text-[#123B68] dark:text-[#F1F5F9] leading-relaxed resize-y"
              required
            />
          </div>

          <div>
            <label
              htmlFor="catalog-syllabus"
              className="block text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] mb-1"
            >
              Materi Pokok (Opsional, satu materi per baris)
            </label>
            <textarea
              id="catalog-syllabus"
              rows={3}
              value={syllabusText}
              onChange={(e) => setSyllabusText(e.target.value)}
              placeholder={'Pengenalan Arsitektur Sistem\nPenerapan Keamanan & Tata Kelola'}
              className="w-full p-3.5 rounded-xl glass-input text-sm text-[#123B68] dark:text-[#F1F5F9] leading-relaxed resize-y"
            />
          </div>

          <div>
            <label
              htmlFor="catalog-admin-note"
              className="block text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] mb-1"
            >
              {isAdmin ? 'Catatan Admin (Opsional)' : 'Catatan Pengajuan ke Admin'}
            </label>
            <textarea
              id="catalog-admin-note"
              rows={2}
              maxLength={500}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder={
                isAdmin
                  ? 'Tambahkan catatan penyelenggaraan atau sasaran peserta (opsional)...'
                  : 'Jelaskan urgensi atau dasar pengajuan pelatihan baru untuk verifikasi Admin...'
              }
              className="w-full p-3.5 rounded-xl glass-input text-sm text-[#123B68] dark:text-[#F1F5F9] leading-relaxed resize-y"
            />
          </div>

          {error && (
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              {error}
            </p>
          )}

          <div className="pt-3 border-t border-[#123B68]/10 dark:border-white/12 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="min-h-[44px] h-11 px-4 rounded-xl glass-surface text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            {!isAdmin && (
              <button
                type="button"
                onClick={() => void submitWithStatus('Belum Diajukan')}
                disabled={submitting}
                className="min-h-[44px] h-11 px-4 rounded-xl glass-surface border border-[#3478C7]/35 text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
              >
                {submittingMode === 'draft' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 text-[#3478C7] dark:text-[#60A5FA]" />
                )}
                <span>{submittingMode === 'draft' ? 'Menyimpan...' : 'Simpan Draf'}</span>
              </button>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="min-h-[44px] h-11 px-5 rounded-xl bg-[#3478C7] hover:bg-[#2A66AC] text-white text-xs font-semibold inline-flex items-center justify-center gap-2 shadow-md shadow-[#3478C7]/25 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
            >
              {submittingMode === 'admin' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>
                {isAdmin
                  ? submittingMode === 'admin'
                    ? 'Menerbitkan...'
                    : 'Simpan & Terbitkan'
                  : submittingMode === 'admin'
                    ? 'Mengajukan...'
                    : 'Simpan & Ajukan ke Admin'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
