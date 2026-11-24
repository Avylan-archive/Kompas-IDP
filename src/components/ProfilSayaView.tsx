import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  FileText,
  Loader2,
  Pencil,
  ShieldCheck,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import { CompetencyPillar, NavPage, SampleProfile } from '../types/kompas';

interface ProfilSayaViewProps {
  profile: SampleProfile;
  pillars: CompetencyPillar[];
  onNavigate: (page: NavPage) => void;
  userName?: string;
  fallbackPhotoUrl?: string | null;
  completedCount?: number;
  onUpdatePhoto?: (photoDataUrl: string | null) => Promise<void>;
  onUpdateProfileDetails?: (position: string, unit: string) => Promise<void>;
  onOpenCvModal?: () => void;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const TARGET_SIZE_PX = 256;
const MAX_DATA_URL_LENGTH = 170000;

async function compressAvatarFile(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Format berkas harus berupa gambar (JPG, PNG, atau WebP).');
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('Ukuran berkas maksimal 5 MB.');
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Gagal membaca berkas gambar.'));
      el.src = objectUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = TARGET_SIZE_PX;
    canvas.height = TARGET_SIZE_PX;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Peramban tidak mendukung pengolahan gambar.');
    }

    // Center-crop to 1:1 square
    const side = Math.min(img.naturalWidth || img.width, img.naturalHeight || img.height);
    const sx = Math.max(0, Math.floor(((img.naturalWidth || img.width) - side) / 2));
    const sy = Math.max(0, Math.floor(((img.naturalHeight || img.height) - side) / 2));

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, TARGET_SIZE_PX, TARGET_SIZE_PX);
    ctx.drawImage(img, sx, sy, side, side, 0, 0, TARGET_SIZE_PX, TARGET_SIZE_PX);

    let dataUrl = canvas.toDataURL('image/jpeg', 0.84);
    if (dataUrl.length > MAX_DATA_URL_LENGTH) {
      dataUrl = canvas.toDataURL('image/jpeg', 0.65);
    }
    if (dataUrl.length > MAX_DATA_URL_LENGTH) {
      dataUrl = canvas.toDataURL('image/jpeg', 0.48);
    }
    return dataUrl;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export const ProfilSayaView: React.FC<ProfilSayaViewProps> = ({
  profile,
  pillars,
  onNavigate,
  userName,
  fallbackPhotoUrl,
  completedCount = 0,
  onUpdatePhoto,
  onUpdateProfileDetails,
  onOpenCvModal,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editPosition, setEditPosition] = useState(profile.position);
  const [editUnit, setEditUnit] = useState(profile.unit);
  const [detailsBusy, setDetailsBusy] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditingDetails) {
      setEditPosition(profile.position);
      setEditUnit(profile.unit);
    }
  }, [profile.position, profile.unit, isEditingDetails]);

  const activePhoto = profile.photoDataUrl || fallbackPhotoUrl || null;
  const hasCustomPhoto = Boolean(profile.photoDataUrl);
  const displayTitle = userName && userName !== 'Aparatur' ? userName : profile.nameLabel;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !onUpdatePhoto) return;

    setPhotoError(null);
    setPhotoBusy(true);
    try {
      const compressed = await compressAvatarFile(file);
      await onUpdatePhoto(compressed);
    } catch (err: unknown) {
      setPhotoError(err instanceof Error ? err.message : 'Gagal memperbarui foto profil.');
    } finally {
      setPhotoBusy(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!onUpdatePhoto) return;
    setPhotoError(null);
    setPhotoBusy(true);
    try {
      await onUpdatePhoto(null);
    } catch (err: unknown) {
      setPhotoError(err instanceof Error ? err.message : 'Gagal menghapus foto profil.');
    } finally {
      setPhotoBusy(false);
    }
  };

  const handleStartEditDetails = () => {
    setEditPosition(profile.position);
    setEditUnit(profile.unit);
    setDetailsError(null);
    setIsEditingDetails(true);
  };

  const handleCancelEditDetails = () => {
    setEditPosition(profile.position);
    setEditUnit(profile.unit);
    setDetailsError(null);
    setIsEditingDetails(false);
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateProfileDetails) return;

    const trimmedPosition = editPosition.trim();
    const trimmedUnit = editUnit.trim();

    if (!trimmedPosition || !trimmedUnit) {
      setDetailsError('Jabatan dan Satuan Kerja wajib diisi.');
      return;
    }

    setDetailsError(null);
    setDetailsBusy(true);
    try {
      await onUpdateProfileDetails(trimmedPosition, trimmedUnit);
      setIsEditingDetails(false);
    } catch {
      setDetailsError('Gagal menyimpan perubahan ke Cloud Firestore.');
    } finally {
      setDetailsBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Profile Card */}
      <section className="glass-surface rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5 flex-1 min-w-0">
          <div className="flex items-center gap-4 shrink-0">
            <div className="relative w-20 h-20 rounded-2xl bg-[#123B68] dark:bg-[#3478C7]/30 border border-[#3478C7]/30 flex items-center justify-center shrink-0 text-white shadow-md overflow-hidden">
              {activePhoto ? (
                <img
                  src={activePhoto}
                  alt={`Foto profil ${displayTitle}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserCheck className="w-8 h-8" />
              )}
              {photoBusy && (
                <div className="absolute inset-0 bg-[#123B68]/65 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                </div>
              )}
            </div>

            {onUpdatePhoto && (
              <div className="flex flex-col gap-1.5 sm:hidden">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={photoBusy}
                  className="min-h-[44px] h-11 px-3.5 rounded-xl glass-surface text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-60"
                >
                  <Camera className="w-3.5 h-3.5 text-[#3478C7] dark:text-[#60A5FA]" />
                  <span>{activePhoto ? 'Ubah Foto' : 'Tambah Foto'}</span>
                </button>
                {hasCustomPhoto && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={photoBusy}
                    className="min-h-[44px] h-11 px-3.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-60"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Foto</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-[#3478C7] dark:text-[#60A5FA]">
              Profil Aparatur · Data Simulasi
            </p>
            <h1 className="mt-1 text-xl sm:text-2xl font-bold text-[#123B68] dark:text-[#F1F5F9]">
              {displayTitle}
            </h1>

            {isEditingDetails ? (
              <form onSubmit={handleSaveDetails} className="mt-3 space-y-3 max-w-xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="edit-profile-position"
                      className="block text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] mb-1"
                    >
                      Jabatan
                    </label>
                    <input
                      id="edit-profile-position"
                      type="text"
                      maxLength={160}
                      value={editPosition}
                      onChange={(e) => setEditPosition(e.target.value)}
                      placeholder="Pranata Komputer Ahli Madya"
                      className="w-full h-10 px-3.5 rounded-xl glass-input text-sm text-[#123B68] dark:text-[#F1F5F9]"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="edit-profile-unit"
                      className="block text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] mb-1"
                    >
                      Satuan Kerja
                    </label>
                    <input
                      id="edit-profile-unit"
                      type="text"
                      maxLength={200}
                      value={editUnit}
                      onChange={(e) => setEditUnit(e.target.value)}
                      placeholder="Ditjen Teknologi Pemerintah Digital"
                      className="w-full h-10 px-3.5 rounded-xl glass-input text-sm text-[#123B68] dark:text-[#F1F5F9]"
                      required
                    />
                  </div>
                </div>

                {detailsError && (
                  <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                    {detailsError}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="submit"
                    disabled={detailsBusy}
                    className="min-h-[44px] h-11 px-4 rounded-xl bg-[#3478C7] hover:bg-[#2A66AC] text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
                  >
                    {detailsBusy ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>{detailsBusy ? 'Menyimpan...' : 'Simpan'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEditDetails}
                    disabled={detailsBusy}
                    className="min-h-[44px] h-11 px-4 rounded-xl glass-surface text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Batal</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-[#174F85]/85 dark:text-[#A7B6CA]">
                <span className="inline-flex items-center gap-1.5 font-medium text-[#123B68] dark:text-[#F1F5F9]">
                  <Briefcase className="w-4 h-4 text-[#3478C7] dark:text-[#60A5FA]" />
                  {profile.position}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[#3478C7] dark:text-[#60A5FA]" />
                  {profile.unit}
                </span>
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {onUpdatePhoto && (
                <div className="hidden sm:flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={photoBusy}
                    className="min-h-[44px] h-11 px-3.5 rounded-xl glass-surface text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] hover:border-[#3478C7]/45 inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-60"
                  >
                    <Camera className="w-3.5 h-3.5 text-[#3478C7] dark:text-[#60A5FA]" />
                    <span>{activePhoto ? 'Ubah Foto Profil' : 'Tambah Foto Profil'}</span>
                  </button>
                  {hasCustomPhoto && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      disabled={photoBusy}
                      className="min-h-[44px] h-11 px-3.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-60"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Foto</span>
                    </button>
                  )}
                </div>
              )}

              {onUpdateProfileDetails && !isEditingDetails && (
                <button
                  type="button"
                  onClick={handleStartEditDetails}
                  className="min-h-[44px] h-11 px-3.5 rounded-xl glass-surface text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] hover:border-[#3478C7]/45 inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5 text-[#3478C7] dark:text-[#60A5FA]" />
                  <span>Edit Jabatan & Satuan Kerja</span>
                </button>
              )}
            </div>

            {photoError && (
              <p className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-400">
                {photoError}
              </p>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {onOpenCvModal && (
            <button
              type="button"
              onClick={onOpenCvModal}
              className="min-h-[44px] h-11 px-4 rounded-xl glass-surface text-xs font-semibold text-[#123B68] dark:text-[#F1F5F9] hover:border-[#3478C7]/45 inline-flex items-center gap-2 whitespace-nowrap cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-[#3478C7] dark:text-[#60A5FA]" />
              <span>Generate CV ({completedCount})</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => onNavigate('rekomendasi')}
            className="min-h-[44px] h-11 px-4 rounded-xl bg-[#3478C7] hover:bg-[#2A66AC] text-white text-xs font-semibold inline-flex items-center gap-2 shadow-md shadow-[#3478C7]/25 whitespace-nowrap cursor-pointer"
          >
            <span>Lihat Rekomendasi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* Owned Competencies vs Development Needs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Kompetensi Dimiliki */}
        <section className="glass-surface rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-[#123B68]/10 dark:border-white/12">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#123B68] dark:text-[#F1F5F9] flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#3478C7] dark:text-[#60A5FA]" />
                  <span>Kompetensi Dimiliki</span>
                </h2>
                <p className="text-xs text-[#174F85]/75 dark:text-[#A7B6CA] mt-0.5">
                  Keahlian inti yang telah dikuasai pada jabatan saat ini.
                </p>
              </div>
              <span className="font-mono text-xs font-semibold tabular-nums text-[#3478C7] dark:text-[#60A5FA]">
                {profile.ownedCompetencies.length} Bidang
              </span>
            </div>

            <ul className="mt-4 divide-y divide-[#123B68]/10 dark:divide-white/10">
              {profile.ownedCompetencies.map((comp, idx) => (
                <li key={comp} className="py-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#3478C7] dark:text-[#60A5FA] shrink-0" />
                    <span className="text-sm font-semibold text-[#123B68] dark:text-[#F1F5F9]">
                      {comp}
                    </span>
                  </div>
                  <span className="font-mono text-xs tabular-nums text-[#174F85]/70 dark:text-[#A7B6CA]">
                    0{idx + 1} · Terpenuhi
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Kompetensi Perlu Dikembangkan */}
        <section className="glass-surface rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-[#123B68]/10 dark:border-white/12">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#123B68] dark:text-[#F1F5F9] flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-[#F28C28]" />
                  <span>Kompetensi Perlu Dikembangkan</span>
                </h2>
                <p className="text-xs text-[#174F85]/75 dark:text-[#A7B6CA] mt-0.5">
                  Prioritas pengembangan yang diarahkan ke pelatihan di Draf IDP.
                </p>
              </div>
              <span className="font-mono text-xs font-semibold tabular-nums text-[#F28C28]">
                {profile.developmentNeeds.length} Prioritas
              </span>
            </div>

            <ul className="mt-4 divide-y divide-[#123B68]/10 dark:divide-white/10">
              {profile.developmentNeeds.map((comp, idx) => (
                <li key={comp} className="py-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="w-2 h-2 rounded-full bg-[#F28C28] shrink-0"
                    />
                    <span className="text-sm font-semibold text-[#123B68] dark:text-[#F1F5F9]">
                      {comp}
                    </span>
                  </div>
                  <span className="font-mono text-xs tabular-nums text-[#174F85]/75 dark:text-[#A7B6CA]">
                    0{idx + 1} · Prioritas
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 pt-3 border-t border-[#123B68]/10 dark:border-white/12 flex items-center justify-between gap-3">
            <span className="text-xs text-[#174F85]/80 dark:text-[#A7B6CA]">
              Cari pelatihan terkait di katalog atau rekomendasi
            </span>
            <button
              type="button"
              onClick={() => onNavigate('katalog')}
              className="min-h-[44px] px-2 -mr-2 inline-flex items-center text-xs font-semibold text-[#3478C7] dark:text-[#60A5FA] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              Buka Katalog &rarr;
            </button>
          </div>
        </section>
      </div>

      {/* Competency Progress Breakdown */}
      <section className="glass-surface rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-[#123B68]/10 dark:border-white/12">
          <h2 className="text-base sm:text-lg font-bold text-[#123B68] dark:text-[#F1F5F9]">
            Rekapitulasi Pilar Kompetensi ({profile.period})
          </h2>
          <span className="font-mono text-xs font-semibold tabular-nums text-[#174F85]/80 dark:text-[#A7B6CA]">
            Target Tahunan: {profile.annualTargetJp} JP
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {pillars.map((pillar) => (
            <div key={pillar.id} className="space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-semibold text-[#123B68] dark:text-[#F1F5F9]">
                  {pillar.name}
                </span>
                <span className="font-mono text-sm font-bold tabular-nums text-[#3478C7] dark:text-[#60A5FA]">
                  {pillar.progressPercentage}%
                </span>
              </div>
              <div className="relative h-2 w-full rounded-full bg-[#123B68]/10 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#174F85] to-[#3478C7] dark:from-[#3478C7] dark:to-[#60A5FA]"
                  style={{ width: `${pillar.progressPercentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between gap-2 text-xs text-[#174F85]/80 dark:text-[#A7B6CA]">
                <span className="truncate">{pillar.description}</span>
                <span className="font-mono tabular-nums shrink-0">
                  {pillar.completedJp}/{pillar.targetJp} JP
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
