import React, { useMemo, useState } from 'react';
import {
  Check,
  Clock,
  Eye,
  Filter,
  Loader2,
  Lock,
  Plus,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import { JABATAN_FILTER_OPTIONS, KOMPETENSI_FILTER_OPTIONS } from '../data/mockKompasData';
import { isTrainingNew } from '../lib/catalogNotifications';
import { TrainingProgram } from '../types/kompas';
import { AddCatalogTrainingModal } from './AddCatalogTrainingModal';
import { GlassSelect } from './GlassSelect';

interface KatalogViewProps {
  trainings: TrainingProgram[];
  idpIds: string[];
  onToggleIdp: (training: TrainingProgram) => void;
  onSelectDetail: (training: TrainingProgram) => void;
  canAddCatalog?: boolean;
  isAdmin?: boolean;
  currentUserUid?: string;
  currentUserName?: string;
  onAddCatalogTraining?: (training: TrainingProgram) => Promise<void>;
  onDeleteCatalogTraining?: (training: TrainingProgram) => Promise<void>;
  onSubmitCatalogToAdmin?: (training: TrainingProgram, adminNote: string) => Promise<void>;
}

export const KatalogView: React.FC<KatalogViewProps> = ({
  trainings,
  idpIds,
  onToggleIdp,
  onSelectDetail,
  canAddCatalog = false,
  isAdmin = false,
  currentUserUid = '',
  currentUserName = 'Aparatur',
  onAddCatalogTraining,
  onDeleteCatalogTraining,
  onSubmitCatalogToAdmin,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('Semua Jabatan');
  const [selectedCompetency, setSelectedCompetency] = useState<string>('Semua Kompetensi');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [submittingAdminId, setSubmittingAdminId] = useState<string | null>(null);
  const [adminFormOpenId, setAdminFormOpenId] = useState<string | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [adminFormError, setAdminFormError] = useState<string | null>(null);

  const filteredTrainings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return trainings.filter((item) => {
      const matchesSearch =
        !q ||
        item.code.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.targetRole.toLowerCase().includes(q) ||
        item.method.toLowerCase().includes(q) ||
        item.level.toLowerCase().includes(q);

      // Pelatihan "Semua Jabatan" selalu ikut tampil apa pun jabatan yang dipilih
      const matchesRole =
        selectedRole === 'Semua Jabatan' ||
        item.targetRoles.includes('Semua Jabatan') ||
        item.targetRoles.includes(selectedRole);

      const matchesComp =
        selectedCompetency === 'Semua Kompetensi' || item.category === selectedCompetency;

      return matchesSearch && matchesRole && matchesComp;
    });
  }, [trainings, searchQuery, selectedRole, selectedCompetency]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedRole !== 'Semua Jabatan' ||
    selectedCompetency !== 'Semua Kompetensi';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedRole('Semua Jabatan');
    setSelectedCompetency('Semua Kompetensi');
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Toolbar */}
      <div className="relative z-20 glass-surface rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#123B68] dark:text-[#F1F5F9]">
              Katalog Pelatihan
            </h1>
            <p className="text-xs sm:text-sm text-[#174F85]/80 dark:text-[#A7B6CA] mt-0.5">
              Menampilkan{' '}
              <span className="font-mono font-semibold tabular-nums text-[#123B68] dark:text-[#F1F5F9]">
                {filteredTrainings.length}
              </span>{' '}
              dari{' '}
              <span className="font-mono font-semibold tabular-nums">{trainings.length}</span>{' '}
              pelatihan
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center">
            <button
              type="button"
              onClick={resetFilters}
              className={`min-h-[44px] h-11 px-3.5 rounded-xl inline-flex items-center gap-1.5 text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                hasActiveFilters
                  ? 'bg-[#3478C7]/12 dark:bg-[#3478C7]/25 text-[#3478C7] dark:text-[#60A5FA] border border-[#3478C7]/30'
                  : 'glass-surface text-[#123B68] dark:text-[#F1F5F9] hover:border-[#3478C7]/40'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>

            {onAddCatalogTraining && canAddCatalog ? (
              <button
                type="button"
                onClick={() => setAddModalOpen(true)}
                className="min-h-[44px] h-11 px-3.5 rounded-xl bg-[#3478C7] hover:bg-[#2A66AC] text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-md shadow-[#3478C7]/25 transition-all whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Pelatihan</span>
              </button>
            ) : (
              <button
                type="button"
                disabled
                title="Penambahan pelatihan ke katalog hanya tersedia untuk Jabatan Ahli Utama"
                className="min-h-[44px] py-2 px-3.5 rounded-xl glass-surface text-xs font-semibold text-[#174F85]/60 dark:text-[#A7B6CA]/70 inline-flex items-center gap-1.5 text-left sm:whitespace-nowrap opacity-75 cursor-not-allowed"
              >
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>Tambah Pelatihan (Khusus Ahli Utama)</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Rounded Glass Search Bar */}
          <div className="relative flex-1">
            <Search
              aria-hidden="true"
              className="w-4 h-4 text-[#174F85]/60 dark:text-[#A7B6CA] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kode, judul pelatihan, jenis, atau kompetensi..."
              aria-label="Cari pelatihan di katalog"
              className="w-full h-11 pl-11 pr-4 rounded-2xl glass-input text-sm text-[#123B68] dark:text-[#F1F5F9] placeholder:text-[#174F85]/55 dark:placeholder:text-[#A7B6CA]/70"
            />
          </div>

          {/* Desktop & Tablet Glassmorphic Dropdown Filters */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <GlassSelect
              label="Filter Jabatan"
              value={selectedRole}
              options={JABATAN_FILTER_OPTIONS}
              onChange={setSelectedRole}
              className="w-[215px]"
            />

            <GlassSelect
              label="Filter Kompetensi"
              value={selectedCompetency}
              options={KOMPETENSI_FILTER_OPTIONS}
              onChange={setSelectedCompetency}
              className="w-[235px]"
            />
          </div>

          {/* Mobile Filter Modal Trigger */}
          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="md:hidden min-h-[44px] h-11 px-4 rounded-2xl glass-input flex items-center justify-center gap-2 text-sm font-semibold text-[#123B68] dark:text-[#F1F5F9] cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#3478C7] dark:text-[#60A5FA]" />
            <span>Filter Jabatan & Kompetensi</span>
            {(selectedRole !== 'Semua Jabatan' || selectedCompetency !== 'Semua Kompetensi') && (
              <span className="w-2 h-2 rounded-full bg-[#F28C28]" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Catalog Grid: 3 cols desktop, 2 cols tablet, 1 col mobile */}
      {filteredTrainings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredTrainings.map((item) => {
            const isInIdp = idpIds.includes(item.id);
            const isOwnedByUser = Boolean(
              currentUserUid && item.createdByUid && item.createdByUid === currentUserUid
            );
            const canDeleteThisItem = isOwnedByUser || isAdmin;
            const approvalStatus = item.approvalStatus ?? 'Belum Diajukan';
            const isConfirmingDelete = confirmDeleteId === item.id;
            const isDeleting = deletingId === item.id;
            const isAdminFormOpen = adminFormOpenId === item.id;
            const isSubmittingAdmin = submittingAdminId === item.id;
            const isNew = isTrainingNew(item);

            return (
              <article
                key={item.id}
                className="glass-surface glass-surface-hover rounded-2xl p-5 sm:p-6 flex flex-col justify-between gap-5"
              >
                <div>
                  {/* Kode · Jenis · Baru · Durasi */}
                  <div className="flex items-center justify-between gap-2 text-xs text-[#174F85]/80 dark:text-[#A7B6CA]">
                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                      <span className="font-mono font-bold tabular-nums text-[#123B68] dark:text-[#F1F5F9]">
                        {item.code}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-semibold text-[#3478C7] dark:text-[#60A5FA]">
                        {item.type}
                      </span>
                      {isNew && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-500/30">
                          Baru
                        </span>
                      )}
                    </div>
                    <span className="font-mono tabular-nums font-semibold shrink-0">
                      {item.durationJp} JP
                    </span>
                  </div>

                  {/* Judul */}
                  <h2 className="mt-2.5 text-[17px] font-bold text-[#123B68] dark:text-[#F1F5F9] leading-snug text-balance">
                    {item.title}
                  </h2>

                  {/* Ringkasan */}
                  <p className="mt-2 text-sm text-[#174F85]/85 dark:text-[#A7B6CA] leading-relaxed line-clamp-2">
                    {item.summary}
                  </p>

                  {/* Status Pengajuan ke Admin (khusus katalog buatan sendiri) */}
                  {isOwnedByUser && (
                    <div className="mt-3 rounded-xl border border-[#123B68]/10 dark:border-white/12 bg-[#3478C7]/5 dark:bg-white/5 px-3 py-2.5 space-y-2">
                      <div className="flex items-center justify-between gap-2 text-[11px] font-semibold">
                        <span className="inline-flex items-center gap-1.5 text-[#123B68] dark:text-[#F1F5F9]">
                          {approvalStatus === 'Disetujui' ? (
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          ) : approvalStatus === 'Menunggu Persetujuan Admin' ? (
                            <Clock className="w-3.5 h-3.5 text-[#3478C7] dark:text-[#60A5FA] shrink-0" />
                          ) : (
                            <Send className="w-3.5 h-3.5 text-[#F28C28] shrink-0" />
                          )}
                          <span>
                            {approvalStatus === 'Disetujui'
                              ? 'Disetujui Admin'
                              : approvalStatus === 'Menunggu Persetujuan Admin'
                                ? 'Diajukan ke Admin · Menunggu Persetujuan'
                                : 'Katalog Mandiri · Belum Diajukan ke Admin'}
                          </span>
                        </span>
                      </div>

                      {item.adminNote && (
                        <p className="text-[11px] text-[#174F85]/80 dark:text-[#A7B6CA] leading-snug">
                          Catatan: {item.adminNote}
                          {item.submittedToAdminAt ? ` (${item.submittedToAdminAt})` : ''}
                        </p>
                      )}

                      {approvalStatus === 'Belum Diajukan' &&
                        onSubmitCatalogToAdmin &&
                        !isAdminFormOpen && (
                          <button
                            type="button"
                            onClick={() => {
                              setAdminFormOpenId(item.id);
                              setAdminNoteInput(item.adminNote || '');
                              setAdminFormError(null);
                            }}
                            className="min-h-[44px] h-11 px-3.5 rounded-lg bg-[#3478C7] hover:bg-[#2A66AC] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Ajukan ke Admin</span>
                          </button>
                        )}

                      {isAdminFormOpen && onSubmitCatalogToAdmin && (
                        <div className="space-y-2 pt-1">
                          <textarea
                            rows={2}
                            maxLength={500}
                            value={adminNoteInput}
                            onChange={(e) => setAdminNoteInput(e.target.value)}
                            placeholder="Alasan / catatan pengajuan ke Admin..."
                            className="w-full p-2.5 rounded-lg glass-input text-xs text-[#123B68] dark:text-[#F1F5F9] resize-y"
                          />
                          {adminFormError && (
                            <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                              {adminFormError}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              disabled={isSubmittingAdmin}
                              onClick={async () => {
                                const trimmed = adminNoteInput.trim();
                                if (!trimmed) {
                                  setAdminFormError('Catatan pengajuan ke Admin wajib diisi.');
                                  return;
                                }
                                setAdminFormError(null);
                                setSubmittingAdminId(item.id);
                                try {
                                  await onSubmitCatalogToAdmin(item, trimmed);
                                  setAdminFormOpenId(null);
                                } catch {
                                  setAdminFormError('Gagal mengirim pengajuan ke Admin.');
                                } finally {
                                  setSubmittingAdminId(null);
                                }
                              }}
                              className="min-h-[44px] h-11 px-3.5 rounded-lg bg-[#3478C7] hover:bg-[#2A66AC] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                            >
                              {isSubmittingAdmin ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Send className="w-3.5 h-3.5" />
                              )}
                              <span>{isSubmittingAdmin ? 'Mengirim...' : 'Kirim Pengajuan'}</span>
                            </button>
                            <button
                              type="button"
                              disabled={isSubmittingAdmin}
                              onClick={() => {
                                setAdminFormOpenId(null);
                                setAdminFormError(null);
                              }}
                              className="min-h-[44px] h-11 px-3.5 rounded-lg glass-surface text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] cursor-pointer disabled:opacity-50"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-3 border-t border-[#123B68]/10 dark:border-white/10">
                  <dl className="space-y-1.5 text-xs text-[#174F85]/85 dark:text-[#A7B6CA]">
                    <div className="flex items-center justify-between gap-2">
                      <dt>Kompetensi</dt>
                      <dd className="font-semibold text-[#123B68] dark:text-[#F1F5F9] text-right">
                        {item.category}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <dt>Mode</dt>
                      <dd className="font-semibold text-[#123B68] dark:text-[#F1F5F9] text-right">
                        {item.method}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <dt>Durasi</dt>
                      <dd className="font-mono tabular-nums font-semibold text-[#123B68] dark:text-[#F1F5F9] text-right">
                        {item.durationJp} JP · {item.level}
                      </dd>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <dt className="shrink-0">Jabatan</dt>
                      <dd className="font-medium text-[#174F85] dark:text-[#CBD5E1] text-right">
                        {item.targetRole}
                      </dd>
                    </div>
                  </dl>

                  {canDeleteThisItem && isConfirmingDelete && onDeleteCatalogTraining && (
                    <div className="rounded-xl border border-rose-500/25 bg-rose-500/8 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                        Hapus katalog ini?
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={async () => {
                            setDeletingId(item.id);
                            try {
                              await onDeleteCatalogTraining(item);
                              setConfirmDeleteId(null);
                            } finally {
                              setDeletingId(null);
                            }
                          }}
                          className="min-h-[44px] h-11 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                        >
                          {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus'}</span>
                        </button>
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => setConfirmDeleteId(null)}
                          className="min-h-[44px] h-11 px-3 rounded-lg glass-surface text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] cursor-pointer disabled:opacity-50"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectDetail(item)}
                      className="min-h-[44px] h-11 px-3.5 rounded-xl glass-surface text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] hover:border-[#3478C7]/40 inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Detail</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleIdp(item)}
                      className={`flex-1 min-w-[140px] min-h-[44px] h-11 px-4 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                        isInIdp
                          ? 'bg-[#123B68]/10 dark:bg-white/12 text-[#123B68] dark:text-[#F1F5F9] hover:bg-[#123B68]/16 dark:hover:bg-white/18'
                          : 'bg-[#3478C7] hover:bg-[#2A66AC] text-white shadow-md shadow-[#3478C7]/25'
                      }`}
                    >
                      {isInIdp ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#F28C28]" />
                          <span>Di IDP Saya</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Tambah ke IDP</span>
                        </>
                      )}
                    </button>

                    {canDeleteThisItem && onDeleteCatalogTraining && (
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmDeleteId((prev) => (prev === item.id ? null : item.id))
                        }
                        aria-label={`Hapus ${item.title} dari katalog`}
                        title={
                          isAdmin
                            ? 'Hapus pelatihan dari katalog'
                            : 'Hapus katalog buatan sendiri'
                        }
                        className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl glass-surface border border-rose-500/25 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 inline-flex items-center justify-center shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="glass-surface rounded-2xl p-10 text-center">
          <Filter className="w-8 h-8 text-[#3478C7] dark:text-[#60A5FA] mx-auto" />
          <h2 className="mt-3 text-lg font-bold text-[#123B68] dark:text-[#F1F5F9]">
            Belum ada pelatihan yang sesuai filter.
          </h2>
          <p className="mt-1.5 text-sm text-[#174F85]/80 dark:text-[#A7B6CA] max-w-md mx-auto">
            Ubah kata kunci pencarian atau pilih opsi jabatan serta kompetensi lainnya.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-5 min-h-[44px] h-11 px-5 rounded-xl bg-[#3478C7] hover:bg-[#2A66AC] text-white text-sm font-semibold cursor-pointer"
          >
            Reset Filter
          </button>
        </div>
      )}

      {/* Mobile Filter Drawer / Modal */}
      {mobileFilterOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden flex items-end justify-center bg-[#0B1628]/55 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-filter-title"
          onClick={() => setMobileFilterOpen(false)}
        >
          <div
            className="glass-surface w-full rounded-t-3xl p-6 space-y-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2
                id="mobile-filter-title"
                className="text-base font-bold text-[#123B68] dark:text-[#F1F5F9]"
              >
                Filter Katalog Pelatihan
              </h2>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                aria-label="Tutup filter"
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-[#123B68] dark:text-[#F1F5F9] hover:bg-[#123B68]/10 dark:hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="block text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] mb-1.5">
                  Jabatan Sasaran
                </p>
                <GlassSelect
                  label="Jabatan Sasaran"
                  value={selectedRole}
                  options={JABATAN_FILTER_OPTIONS}
                  onChange={setSelectedRole}
                  placement="top"
                />
              </div>

              <div>
                <p className="block text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] mb-1.5">
                  Kompetensi
                </p>
                <GlassSelect
                  label="Kompetensi"
                  value={selectedCompetency}
                  options={KOMPETENSI_FILTER_OPTIONS}
                  onChange={setSelectedCompetency}
                  placement="top"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={resetFilters}
                className="min-h-[44px] h-11 px-4 rounded-xl glass-surface text-sm font-semibold text-[#123B68] dark:text-[#F1F5F9] cursor-pointer"
              >
                Reset Filter
              </button>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 min-h-[44px] h-11 px-5 rounded-xl bg-[#3478C7] text-white text-sm font-semibold shadow-md cursor-pointer"
              >
                Terapkan ({filteredTrainings.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {onAddCatalogTraining && canAddCatalog && currentUserUid && (
        <AddCatalogTrainingModal
          isOpen={addModalOpen}
          existingIds={trainings.map((t) => t.id)}
          creatorUid={currentUserUid}
          creatorName={currentUserName}
          isAdmin={isAdmin}
          onClose={() => setAddModalOpen(false)}
          onSubmit={onAddCatalogTraining}
        />
      )}
    </div>
  );
};
